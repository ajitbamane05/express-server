const express = require("express");
const fs = require("fs");
const path = require("path");
const formidable = require("formidable");

const app = express();

app.get("/upload", (req, res) => {
  res.status(200).send({ message: "Hello from get post!" });
});

// Set up a route to handle file upload
app.post("/upload", (req, res) => {
  const options = { maxFileSize: 2 * 1024 * 1024 * 1024 };
  const form = formidable.formidable(options);

  // Set the directory to store uploaded files
  form.uploadDir = path.join(__dirname, "uploads");

  // Increase the maximum file size allowed for file uploads

  // Parse the incoming request
  form.parse(req, (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: "Error parsing file upload", err });
    }
    const Files = files["video"];
    for (let i = 0; i < Files.length; i++) {
      console.log(Files[i].filepath, fields);
      if (Files[i].size > 2 * 1024 * 1024 * 1024) {
        return res.status(400).json({ error: "File size exceeds 2GB limit" });
      }

      // Create a readable stream to read the file in chunks
      const readStream = fs.createReadStream(Files[i].filepath);

      // Create a writable stream to store the file on the server
      const writeStream = fs.createWriteStream(
        path.join(form.uploadDir, Files[i].originalFilename)
      );
      readStream.pipe(writeStream);
      // Event listeners for when the file read and write are complete
      readStream.on("end", () => {
        // Remove the temporary file
        fs.unlinkSync(Files[i].filepath);
        console.log(`${i + 1} File uploaded successfully`);
        if (i === Files.length - 1) {
          // Send response only when all files are processed
          res.status(200).json({ message: "All files uploaded successfully" });
        }
      });

      writeStream.on("finish", () => {
        console.log(i + 1, "File write complete");
      });
      writeStream.on("error", (err) => {
        console.error("Error writing file:", err);
        res.status(500).json({ error: "Error writing file to server" });
      });
    }
  });
});

// Start the server
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
