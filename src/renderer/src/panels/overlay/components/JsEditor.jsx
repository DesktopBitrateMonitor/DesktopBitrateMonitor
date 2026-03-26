import Editor from '@monaco-editor/react';
import React, { useEffect, useRef, useState } from 'react';

const JsEditor = ({ workingConfig, setWorkingConfig }) => {
  const [jsCode, setJsCode] = useState('Loading JavaScript...');
  const updateTimeoutRef = useRef(null);

  useEffect(() => {
    setJsCode(workingConfig.js || '');
  }, [workingConfig.js]);

  const updateJsCode = (value) => {
    const safeValue = value ?? '';
    setJsCode(safeValue);

    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(() => {
      setWorkingConfig((prevConfig) => ({ ...prevConfig, js: safeValue }));
    }, 300);
  };

  useEffect(() => () => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
  }, []);

  return (
    <Editor
      theme="vs-dark"
      height="80vh"
      defaultLanguage="javascript"
      value={jsCode}
      onChange={(value) => updateJsCode(value)}
    />
  );
};

export default JsEditor;
