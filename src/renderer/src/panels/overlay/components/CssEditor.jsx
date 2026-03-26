import { Editor } from '@monaco-editor/react';
import React, { useEffect, useRef, useState } from 'react';

const CssEditor = ({ workingConfig, setWorkingConfig }) => {
  const [cssCode, setCssCode] = useState('Loading CSS...');
  const updateTimeoutRef = useRef(null);

  useEffect(() => {
    setCssCode(workingConfig.css || '');
  }, [workingConfig.css]);

  const updateCssCode = (value) => {
    const safeValue = value ?? '';
    setCssCode(safeValue);

    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(() => {
      setWorkingConfig((prevConfig) => ({ ...prevConfig, css: safeValue }));
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
      defaultLanguage="css"
      value={cssCode}
      onChange={(value) => updateCssCode(value)}
    />
  );
};

export default CssEditor;
