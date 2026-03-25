import { Editor } from '@monaco-editor/react';
import React, { useEffect, useState } from 'react';

const HtmlEditor = ({ workingConfig, setWorkingConfig }) => {
  const [htmlCode, setHtmlCode] = useState('Loading HTML...');

  useEffect(() => {
    setHtmlCode(workingConfig.html || '');
  }, [workingConfig.html]);

  const updateHtmlCode = (value) => {
    setHtmlCode(value);
    setWorkingConfig({ ...workingConfig, html: value });
  };

  return (
    <Editor
      theme="vs-dark"
      height="80vh"
      defaultLanguage="html"
      value={htmlCode}
      onChange={(value) => updateHtmlCode(value)}
      onMount={(editor) => {
        editor.onDidChangeModelContent(() => {
          updateHtmlCode(editor.getValue());
        });
      }}
    />
  );
};

export default HtmlEditor;
