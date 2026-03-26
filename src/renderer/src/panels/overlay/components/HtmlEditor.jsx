import { Editor } from '@monaco-editor/react';
import React, { useEffect, useRef, useState } from 'react';

const HtmlEditor = ({ workingConfig, setWorkingConfig }) => {
  const [htmlCode, setHtmlCode] = useState('Loading HTML...');
  const updateTimeoutRef = useRef(null);

  useEffect(() => {
    setHtmlCode(workingConfig.html || '');
  }, [workingConfig.html]);

  const updateHtmlCode = (value) => {
    const safeValue = value ?? '';
    setHtmlCode(safeValue);

    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(() => {
      setWorkingConfig((prevConfig) => ({ ...prevConfig, html: safeValue }));
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
      defaultLanguage="html"
      value={htmlCode}
      onChange={(value) => updateHtmlCode(value)}
    />
  );
};

export default HtmlEditor;
