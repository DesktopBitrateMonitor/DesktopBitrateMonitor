import { app } from 'electron';
import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * Options for creating a new Store instance.
 */
export interface StoreOptions {
  /**
   * File name for the JSON config. Defaults to `'app-config.json'`.
   */
  name?: string;

  /**
   * Default key-value pairs to prefill in the store.
   */
  defaults?: Record<string, any>;
}

type ChangeCallback = (newValue: any, oldValue: any) => void;

/**
 * A simple persistent JSON key-value store with nested key support.
 */
export default class Store {
  private path: string;
  private defaults: Record<string, any>;
  private data: Record<string, any>;
  private listeners: Map<string, Set<ChangeCallback>> = new Map();

  constructor(options: StoreOptions = {}) {
    const baseDir =
      process.platform === 'win32'
        ? path.join(os.homedir(), 'AppData', 'Roaming')
        : process.platform === 'darwin'
          ? path.join(os.homedir(), 'Library', 'Application Support')
          : path.join(os.homedir(), '.config');

    let fileName = options.name || 'app-config.json';
    if (!fileName.endsWith('.json')) {
      fileName += '.json';
    }

    const folderPath = path.join(baseDir, app.name);
    this.path = path.join(folderPath, fileName);
    this.defaults = options.defaults || {};

    this.data = loadFile(this.path);
    mergeDefaults(this.data, this.defaults);
    saveFile(this.path, this.data);
  }

  /**
   * Get the data from the key.
   *
   * @param key - The key for expected data
   * @returns The data
   *
   * @example
   * ```
   * console.log(store.get('foo'));
   * //=> {foo: 'bar'}
   * ```
   */
  get(key?: string): any {
    this.data = loadFile(this.path);
    return key ? getNested(this.data, key) : this.data;
  }

  /**
   * Set a key with data in the store.
   * Overwrite keys with data if they exists already.
   *
   * @param key - Key to store the data. __Can be a nested key too__
   * @param value - The Data to store in the key
   *
   * @example
   * ```
   * store.set('foo', {key: value});
   * store.set('foo', value);
   * store.set('foo.nest', value);
   * ```
   */

  set(key: string, value: any): void {
    const oldValue = this.get(key);
    setNested(this.data, key, value);
    saveFile(this.path, this.data);
    this.emitChange(key, value, oldValue);
  }

  /**
   * Delete the key with all items.
   *
   * @param key - The key to delete
   *
   * @example
   * ```
   * store.delete('foo');
   * ```
   */
  delete(key: string): void {
    const oldValue = this.get(key);
    deleteNested(this.data, key);
    saveFile(this.path, this.data);
    this.emitChange(key, undefined, oldValue);
  }

  /**
   * Rest all items to default values.
   */
  clear(): void {
    const oldData = structuredClone(this.data);
    this.data = {};
    mergeDefaults(this.data, this.defaults);
    saveFile(this.path, this.data);

    // Emit change events for cleared keys.
    for (const key of Object.keys(oldData)) {
      const oldVal = oldData[key];
      const newVal = this.data[key];
      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        this.emitChange(key, newVal, oldVal);
      }
    }
  }

  /**
   * Check if a key exists.
   *
   * @param key - The key to check if exists
   * @returns true or false
   */
  has(key: string): boolean {
    return getNested(this.data, key) !== undefined;
  }

  /**
   * Register a listener for when a specific key changes.
   */
  onDidChange(key: string, callback: ChangeCallback): void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(callback);
  }

  /**
   * Remove a change listener.
   */
  offDidChange(key: string, callback: ChangeCallback): void {
    this.listeners.get(key)?.delete(callback);
  }

  private emitChange(key: string, newValue: any, oldValue: any) {
    if (JSON.stringify(newValue) === JSON.stringify(oldValue)) return;

    const listeners = this.listeners.get(key);
    if (listeners) {
      for (const cb of listeners) {
        cb(newValue, oldValue);
      }
    }
  }
}

function loadFile(filePath: string): Record<string, any> {
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error loading store:', err);
  }
  return {};
}

function saveFile(filePath: string, data: Record<string, any>): void {
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error saving store:', err);
  }
}

/**
 * Merge the default values if a new value added into the defaults
 * If a default value removed from the defaults, the entry are NOT removed from the json file
 *
 */

/**
 * Recursively merges only missing keys from `defaults` into `target`.
 * Existing keys (including primitives, arrays, and objects) are left untouched.
 * No structural coercion: if `defaults` has an object for a key but `target` already
 * has a primitive/array there, it is NOT replaced or converted.
 */
function mergeDefaults(target: Record<string, any>, defaults: Record<string, any>): void {
  for (const key of Object.keys(defaults)) {
    const defVal = defaults[key];
    const hasKey = Object.prototype.hasOwnProperty.call(target, key);

    if (!hasKey) {
      // Key missing -> copy entire default branch/primitive as-is
      target[key] = defVal;
      continue;
    }

    // If default is a plain object and target has a plain object -> recurse.
    const isPlainObject = typeof defVal === 'object' && defVal !== null && !Array.isArray(defVal);
    const targetVal = target[key];
    const targetIsPlain =
      typeof targetVal === 'object' && targetVal !== null && !Array.isArray(targetVal);

    if (isPlainObject && targetIsPlain) {
      mergeDefaults(targetVal, defVal);
    }
    // Else: existing value stays as-is (no overwrite, no conversion)
  }
}

function getNested(obj: Record<string, any>, key: string): any {
  return key.split('.').reduce((acc, k) => (acc ? acc[k] : undefined), obj);
}

function setNested(obj: Record<string, any>, key: string, value: any): void {
  const keys = key.split('.');
  const lastKey = keys.pop()!;
  const target = keys.reduce((acc, k) => {
    if (typeof acc[k] !== 'object' || acc[k] === null) acc[k] = {};
    return acc[k];
  }, obj);
  target[lastKey] = value;
}

function deleteNested(obj: Record<string, any>, key: string): void {
  const keys = key.split('.');
  const lastKey = keys.pop()!;
  const target = keys.reduce((acc, k) => acc?.[k], obj);
  if (target && typeof target === 'object') {
    delete target[lastKey];
  }
}
