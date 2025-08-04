# PDF Assets

This directory contains base64-encoded PDF files used for testing and development.

## Files

- `sample-pdf.txt` - A simple single-page PDF with sample content
- `multi-page-pdf.txt` - A two-page PDF for testing multi-page functionality

## Usage

These files are imported as raw text in the `pdf-utils.ts` file and converted to data URLs for use in the PDF viewer components.

## Content

- **Sample PDF**: Contains "Sample PDF Document" text with testing information
- **Multi-page PDF**: Contains "Page 1: Hello, World!" and "Page 2: Second Page" text

## Format

The files contain pure base64 data without the `data:application/pdf;base64,` prefix, which is added programmatically in the code.
