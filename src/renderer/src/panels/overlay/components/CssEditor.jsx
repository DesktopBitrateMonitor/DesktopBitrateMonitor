import { Editor } from '@monaco-editor/react';
import React, { useEffect, useState } from 'react';

const CssEditor = ({ workingConfig, setWorkingConfig }) => {
  const [cssCode, setCssCode] = useState('Loading CSS...');

  useEffect(() => {
    setCssCode(workingConfig.css || '');
  }, [workingConfig.css]);

  const updateCssCode = (value) => {
    setCssCode(value);
    setWorkingConfig({ ...workingConfig, css: value });
  };

  return (
    <Editor
      theme="vs-dark"
      height="80vh"
      defaultLanguage="css"
      value={cssCode}
      onChange={(value) => updateCssCode(value)}
      onMount={(editor) => {
        editor.onDidChangeModelContent(() => {
          updateCssCode(editor.getValue());
        });
      }}
    />
  );
};

export default CssEditor;
