import React, { useState } from "react";
import Button from "@mui/material/Button";
import Input from "@mui/material/Input";
import axios from "axios";
import UserReviewPic from "../src/userreviewpic.png";

const FileUpload = () => {
  const apiUrl = process.env.REACT_APP_REVIEW_BUDDY_API_URL;

  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
  };

  const isZipFile = (file) => {
    const allowedExtensions = ["zip"];
    const fileExtension = file.name.split(".").pop();
    return allowedExtensions.includes(fileExtension);
  };

  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = (error) => reject(error);
    });
  };

  const submitFile = async () => {
    if (!selectedFile) {
      alert("Please select a file.");
      return;
    }

    if (!isZipFile(selectedFile)) {
      alert("Please select a valid zip file.");
      return;
    }

    try {
      const base64String = await convertFileToBase64(selectedFile);

      const requestBody = {
        body: base64String,
      };

      const response = await axios.post(apiUrl, requestBody, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Handle the response as needed
      console.log("Response:", response.data);
      alert("File uploaded successfully.");
    } catch (error) {
      // Handle errors here
      console.error("Error:", error);
      alert("An error occurred while uploading the file.");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
      }}
    >
      <h2>Review Summarizer</h2>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          marginBottom: "20px",
        }}
      >
        <p>
          Add your multiple customer reviews in a zip file and get a compiled
          file with all the reviews
        </p>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <img
          src={UserReviewPic}
          alt="User Review"
          style={{ height: "300px", width: "300px", marginRight: "20px" }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            border: "1px solid #ccc",
            padding: "20px",
            borderRadius: "5px",
            marginBottom: "10px",
          }}
        >
          <h2 style={{ marginBottom: "25px" }}>Upload Zip File</h2>
          <Input
            style={{ marginBottom: "25px" }}
            type="file"
            accept=".zip"
            onChange={handleFileChange}
          />
          <Button
            style={{ marginBottom: "25px" }}
            variant="contained"
            color="primary"
            disabled={!selectedFile}
            onClick={submitFile}
          >
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
