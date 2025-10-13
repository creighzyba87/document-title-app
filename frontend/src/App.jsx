import React, {useState} from 'react';
import axios from 'axios';

export default function App(){
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState(null);
  const [loading, setLoading] = useState(false);
  const API_URL = process.env.REACT_APP_API_URL || '/upload';

  async function submit(e){
    e.preventDefault();
    if (!file) return alert('Choose a file first');
    setLoading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await axios.post(API_URL, fd, { headers: { 'Content-Type': 'multipart/form-data' }});
      setTitle(res.data.title || 'No title returned');
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    } finally { setLoading(false); }
  }

  return (
    <div style={{ maxWidth: 680, margin: 40 }}>
      <h1>Document Title Generator</h1>
      <form onSubmit={submit}>
        <input type="file" onChange={e=>setFile(e.target.files[0])} />
        <button disabled={loading} style={{marginLeft:10}}>{loading? 'Working...' : 'Generate Title'}</button>
      </form>
      {title && (
        <div style={{marginTop:20}}>
          <h3>Generated title</h3>
          <div style={{padding:12, border:'1px solid #ddd', borderRadius:6}}>{title}</div>
        </div>
      )}
    </div>
  );
}
