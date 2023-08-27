import React, { useState } from "react";
import Button from "@mui/material/Button";
import Input from "@mui/material/Input";
import axios from "axios";

const FileUpload = () => {
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

  const submitFile = async () => {
    if (!selectedFile) {
      alert("Please select a file.");
      return;
    }

    if (!isZipFile(selectedFile)) {
      alert("Please select a valid zip file.");
      return;
    }

    const formData = new FormData();
    formData.append("zipFile", selectedFile);

    try {
      const response = await axios.post(
        "https://b6dzy3101e.execute-api.us-east-1.amazonaws.com/prod/reviewbuddy",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

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
    <div style={{ margin: "20px" }}>
      <h2>Upload Zip File</h2>
      <Input type="file" accept=".zip" onChange={handleFileChange} />
      <Button
        variant="contained"
        color="primary"
        disabled={!selectedFile}
        onClick={submitFile}
        style={{ marginTop: "10px" }}
      >
        Submit
      </Button>
    </div>
  );
};

export default FileUpload;
