import React from 'react';

function ContentPanel({ data }) {
  return (
    <div className="content-panel">
      <h2>{data.title}</h2>
      <p>{data.content}</p>
    </div>
  );
}

export default ContentPanel;
