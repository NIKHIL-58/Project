import React, { useState } from 'react';
import { generateJD } from '../api'; 

function GenerateJD() {
  const [selectedProfile, setSelectedProfile] = useState('');
  const [jd, setJD] = useState('');
  
  const profiles = ['Software Engineer', 'E-commerce Specialist', 'Data Analyst', 'Marketing Manager'];

  const handleGenerate = async () => {
    if (selectedProfile) {
      const response = await generateJD(selectedProfile);
      setJD(response.data.job_description);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Generate Job Description</h2>
      <div>
        <label>Select a profile:</label>
        <select onChange={(e) => setSelectedProfile(e.target.value)} value={selectedProfile}>
          <option value="">Select a profile</option>
          {profiles.map((profile) => (
            <option key={profile} value={profile}>{profile}</option>
          ))}
        </select>
        <button onClick={handleGenerate} style={{ marginLeft: '10px' }}>Generate JD</button>
      </div>
      {jd && (
        <div style={{ marginTop: '20px' }}>
          <h3>Generated Job Description:</h3>
          <textarea rows="10" cols="50" value={jd} readOnly />
        </div>
      )}
    </div>
  );
}

export default GenerateJD;