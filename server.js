const express = require("express");
const fs = require("fs");
const path = require("path");
const formidable = require("formidable");

const app = express();

app.get("/upload", async (req, res) => {
  res.status(200).send({ message: "Hello from get post!" });
});

// Set up a route to handle file upload
app.post("/upload", async (req, res) => {
    const options = { maxFileSize: 2 * 1024 * 1024 * 1024 };
    const form = formidable.formidable(options);
    // Set the directory to store uploaded files
    form.uploadDir = path.join(__dirname, "uploads");
  
    try {
      const { video: files } = await new Promise((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
          if (err) reject(err);
          else resolve(files);
        });
      });
  
      // Process each file asynchronously
      await Promise.all(
        files.map(async (file, index) => {
          if (file.size > 2 * 1024 * 1024 * 1024) {
            throw new Error("File size exceeds 2GB limit");
          }
  
          const readStream = fs.createReadStream(file.filepath);
          const writeStream = fs.createWriteStream(
            path.join(form.uploadDir, file.originalFilename)
          );
  
          // Pipe the read stream to the write stream
          await new Promise((resolve, reject) => {
            readStream.pipe(writeStream);
            writeStream.on("finish", resolve);
            writeStream.on("error", reject);
          });
  
          // Remove the temporary file
          fs.unlinkSync(file.filepath);
          console.log(`${index + 1} File uploaded successfully`);
        })
      );
  
      res.status(200).json({ message: "All files uploaded successfully" });
    } catch (error) {
      console.error("Error uploading files:", error);
      res.status(500).json({ error: "Error uploading files" });
    }
  });
  

// Start the server
const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
