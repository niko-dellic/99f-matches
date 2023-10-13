const fs = require("fs-extra");
const pdf = require("pdf-parse");
const Jimp = require("jimp");

// Function to change the font for all text in a PDF
async function changeFontForPDF(pdfPath, fontName, fontSize) {
  try {
    const dataBuffer = await fs.readFile(pdfPath);
    const pdfData = await pdf(dataBuffer);

    // Check if the PDF has at least one page
    if (pdfData.numpages < 1) {
      console.error(`No pages found in ${pdfPath}`);
      return;
    }

    // Extract all text from the PDF
    const text = pdfData.text;

    // Create a Jimp image with the desired font and text
    const image = new Jimp(1920, 1080); // Adjust the dimensions as needed
    const fontPath = `./fonts/michroma.ttf`; // Replace with the path to your custom font file

    // Load the custom font
    Jimp.loadFont(Jimp.FONT_SANS_32_BLACK).then((customFont) => {
      Jimp.read(1920, 1080, (err, image) => {
        if (err) {
          console.error(`Error creating image: ${err}`);
          return;
        }

        // Draw the text with the custom font on the image
        image.print(customFont, 0, 0, "Your Text");

        // Save the modified image as a PNG
        image.write("output/modified_image.png", (err) => {
          if (err) {
            console.error(`Error saving image: ${err}`);
          } else {
            console.log("Image saved successfully");
          }
        });
      });
    });

    console.log(`Processing PDF: ${pdfPath}`);

    // Draw the text with the custom font on the image
    await image.print(customFont, 0, 0, { text });

    // Save the modified image as a PNG
    const outputPath = `output/img/${pdfPath.replace(/\.pdf$/i, ".png")}`; // Specify the output file path
    await image.write(outputPath);

    console.log(`PDF converted to image with the selected font: ${outputPath}`);
  } catch (error) {
    console.error(`Error processing PDF: ${error.message}`);
  }
}

// Define the directory containing the PDF files
const pdfDirectory = "./output/pdf";

// Define the font name and font size
const fontName = "michroma";
const fontSize = 32;

// Read and process each PDF file in the directory
fs.readdir(pdfDirectory, (err, files) => {
  if (err) {
    console.error(`Error reading directory: ${err}`);
  } else {
    files.forEach((file) => {
      if (file.toLowerCase().endsWith(".pdf")) {
        const pdfPath = `${pdfDirectory}/${file}`;
        changeFontForPDF(pdfPath, fontName, fontSize);
      }
    });
  }
});
