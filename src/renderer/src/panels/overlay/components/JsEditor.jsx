import Editor from '@monaco-editor/react';
import React, { useEffect, useState } from 'react';

const JsEditor = ({ workingConfig, setWorkingConfig }) => {
  const [jsCode, setJsCode] = useState('Loading JavaScript...');

  useEffect(() => {
    setJsCode(workingConfig.js || '');
  }, [workingConfig.js]);

  const updateJsCode = (value) => {
    setJsCode(value);
    setWorkingConfig({ ...workingConfig, js: value });
  }

  return (
    <Editor
      theme="vs-dark"
      height="80vh"
      defaultLanguage="javascript"
      value={jsCode}
      onChange={(value) => updateJsCode(value)}
      onMount={(editor) => {
        editor.onDidChangeModelContent(() => {
          updateJsCode(editor.getValue());
        });
      }}
    />
  );
};

export default JsEditor;
