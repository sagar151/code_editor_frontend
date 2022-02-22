import axios from "axios";
import "./App.css";
// import stubs from "./stubs";
import React, { useState, useEffect } from "react";
import Button from "@mui/material/Button"
import NativeSelect from '@mui/material/NativeSelect';

import moment from "moment";

function App() {
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [language, setLanguage] = useState("cpp");
  const [jobId, setJobId] = useState(null);
  const [status, setStatus] = useState(null);
  const [jobDetails, setJobDetails] = useState(null);

  

  useEffect(() => {
    const defaultLang = localStorage.getItem("default-language") || "cpp";
    setLanguage(defaultLang);
  }, []);

  let pollInterval;

  const handleSubmit = async () => {
    const payload = {
      language,
      code,
    };
    try {
      setOutput("");
      setStatus(null);
      setJobId(null);
      setJobDetails(null);
      const { data } = await axios.post("http://localhost:8080/run", payload);
      if (data.jobId) {
        setJobId(data.jobId);
        setStatus("Submitted.");

        // poll here
        pollInterval = setInterval(async () => {
          const { data: statusRes } = await axios.get(
            `http://localhost:8080/status`,
            {
              params: {
                id: data.jobId,
              },
            }
          );
          const { success, job, error } = statusRes;
          console.log(statusRes);
          if (success) {
            const { status: jobStatus, output: jobOutput } = job;
            setStatus(jobStatus);
            setJobDetails(job);
            if (jobStatus === "pending") return;
            setOutput(jobOutput);
            clearInterval(pollInterval);
          } else {
            console.error(error);
            setOutput(error);
            setStatus("Bad request");
            clearInterval(pollInterval);
          }
        }, 1000);
      } else {
        setOutput("Retry again.");
      }
    } catch ({ response }) {
      if (response) {
        const errMsg = response.data.err.stderr;
        setOutput(errMsg);
      } else {
        setOutput("Please retry submitting.");
      }
    }
  };

  const setDefaultLanguage = () => {
    localStorage.setItem("default-language", language);
    console.log(`${language} set as default!`);
  };

  const renderTimeDetails = () => {
    if (!jobDetails) {
      return "";
    }
    let { submittedAt, startedAt, completedAt } = jobDetails;
    let result = "";
    submittedAt = moment(submittedAt).toString();
    result += `Job Submitted At: ${submittedAt}  `;
    if (!startedAt || !completedAt) return result;
    const start = moment(startedAt);
    const end = moment(completedAt);
    const diff = end.diff(start, "seconds", true);
    result += `Execution Time: ${diff}s`;
    return result;
  };

  return (
    <div className="App">
      <h1>Online Code Compiler</h1>
      <div>
        <label>Language:</label>
        <NativeSelect
          value={language}
          onChange={(e) => {
            const shouldSwitch = window.confirm(
              "WARNING : your code will lost are you want to change"
            );
            if (shouldSwitch) {
              setLanguage(e.target.value);
            }
          }}
        >
          <option value="cpp"> C++</option>
          <option value="py"> Python</option>
          <option value="js"> JavaScript</option>
        </NativeSelect>
      </div>
      <br />
      <div>
        <Button variant="contained" color="primary" onClick={setDefaultLanguage}>Set Default</Button>
      </div>
      <br />
      <textarea
       className="textarea"
        rows="30"
        cols="120"
        value={code}
        onChange={(e) => {
          setCode(e.target.value);
        }}
      ></textarea>
      <br />
      <Button variant="contained" color="secondary" onClick={handleSubmit}>Submit</Button>
      <p>Status:  {status}</p>
      <p>{jobId ? `Job id: ${jobId}` : ""}</p>
      <p>{renderTimeDetails()}</p>
      <div className="output">
        <strong>Output: </strong>
        <br/>
        <pre>{output}</pre>
      </div>
      {/* <p>Output</p>
      <Card>{output}</Card> */}
    </div>
  );
}

export default App;