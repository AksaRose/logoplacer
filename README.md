# Logoplacer - Figma Plugin

## Description

A Figma plugin that automatically arranges logos within frames while maintaining proper spacing and aspect ratios. Perfect for creating partner sections, client showcases, and marketing materials.


https://github.com/user-attachments/assets/1cd17909-6df6-47b0-b04a-a657e1e2c2ba


## Features

* Smart logo placement with automatic spacing

* Maintains original logo aspect ratios

* Maximum dimensions: 125px width, 50px height

* Consistent edge padding (20px)

* Supports up to 4 logos

* One-click reset functionality

* Simple drag-and-drop interface

## Installation

1\. Open Figma Desktop

2\. Go to `Plugins > Development > Import plugin from manifest...`

3\. Select the `manifest.json` file from this project

## How to Use

1\. Select a frame in your Figma design

2\. Launch Logo Placer from the plugins menu

3\. Click to upload logos (maximum 4)

4\. Logos will automatically arrange within the frame

5\. Use the reset button to clear and start over

### Placement Rules

* **Single logo**: Left-aligned with edge padding

* **Two logos**: Placed at left and right edges

* **Three/Four logos**: Equally spaced across frame width

## Development Setup

### Prerequisites

* [Node.js](https://nodejs.org/)

* Figma desktop app

* Code editor (VS Code recommended)

### Local Development

```bash

# Clone the repository

git clone https://github.com/AksaRose/logoplacer.git


# Install dependencies

npm install


```



## Technical Details

### Size Constraints

* Maximum width: 125px

* Maximum height: 50px

* Edge padding: 20px

* Maximum logos: 4

### Supported Image Formats

* PNG

* JPG



## Troubleshooting

### Common Issues

#### Logo Not Appearing

* Ensure a frame is selected

* Verify image format is supported

* Check if image file is valid

#### Logos Misaligned

* Verify frame width is sufficient

* Check frame selection

#### Plugin Not Responding

* Refresh Figma file

* Restart plugin

* Clear plugin cache


*Made with ❤️ for the Figma community*
