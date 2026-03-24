import Editor from '@monaco-editor/react';

import React from 'react';

const JsEditor = () => {
  return (
    <Editor
      height="90vh"
      defaultLanguage="javascript"
      defaultValue="// Write your custom JavaScript here"
    />
  );
};

export default JsEditor;
