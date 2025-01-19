figma.showUI(__html__, { width: 300, height: 400 });

let uploadedLogos = [];
const MAX_LOGOS = 4;
const EDGE_PADDING = 20;
const MAX_WIDTH = 125;
const MAX_HEIGHT = 40;

function calculateDimensions(originalWidth, originalHeight) {
  const aspectRatio = originalWidth / originalHeight;
  let newWidth, newHeight;
  
  // First, scale based on max height
  if (originalHeight > MAX_HEIGHT) {
    newHeight = MAX_HEIGHT;
    newWidth = MAX_HEIGHT * aspectRatio;
  } else {
    newHeight = originalHeight;
    newWidth = originalWidth;
  }
  
  // Then check if width exceeds max width and scale down if necessary
  if (newWidth > MAX_WIDTH) {
    newWidth = MAX_WIDTH;
    newHeight = MAX_WIDTH / aspectRatio;
  }
  
  return { width: newWidth, height: newHeight };
}

function calculatePosition(frame, index, totalLogos, logoWidths) {
  const leftPosition = EDGE_PADDING;
  
  switch(totalLogos) {
    case 1:
      return leftPosition;
    case 2:
      if (index === 0) {
        return leftPosition;
      } else {
        return frame.width - EDGE_PADDING - logoWidths[index];
      }
    case 3:
    case 4:
      const totalLogoWidth = logoWidths.reduce((sum, width) => sum + width, 0);
      const availableSpace = frame.width - (2 * EDGE_PADDING) - totalLogoWidth;
      const spacing = availableSpace / (totalLogos - 1);
      
      let position = EDGE_PADDING;
      for (let i = 0; i < index; i++) {
        position += logoWidths[i] + spacing;
      }
      return position;
  }
}

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'upload-logo') {
    const selection = figma.currentPage.selection;
    if (selection.length === 0 || selection[0].type !== 'FRAME') {
      figma.notify('Please select a frame first');
      return;
    }

    const frame = selection[0];
    try {
      const image = figma.createImage(msg.imageData);
      const dimensions = msg.dimensions;
      
      uploadedLogos.push({
        image: image,
        originalWidth: dimensions.width,
        originalHeight: dimensions.height
      });
      
      await updateLogoPositions(frame, uploadedLogos);
      figma.notify(`Logo ${uploadedLogos.length} added successfully!`);
      
      if (uploadedLogos.length >= MAX_LOGOS) {
        figma.ui.postMessage({ type: 'max-logos-reached' });
      }
    } catch (error) {
      figma.notify('Error placing logo: ' + error.message);
    }
  } else if (msg.type === 'reset') {
    uploadedLogos = [];
    const frame = figma.currentPage.selection[0];
    if (frame) {
      const logos = frame.findAll(node => node.name.startsWith('Logo'));
      logos.forEach(logo => logo.remove());
    }
    figma.notify('Reset successful');
  }
};

async function placeLogo(frame, logoData, index, xPosition) {
  const logo = figma.createRectangle();
  logo.name = `Logo ${index + 1}`;
  
  try {
    const { originalWidth, originalHeight } = logoData;
    const { width: newWidth, height: newHeight } = calculateDimensions(originalWidth, originalHeight);
    
    logo.resize(newWidth, newHeight);
    logo.fills = [{
      type: 'IMAGE',
      imageHash: logoData.image.hash,
      scaleMode: 'FILL'
    }];
    
    logo.y = EDGE_PADDING;
    logo.x = xPosition;
    frame.appendChild(logo);
    
    return { width: newWidth, height: newHeight };
    
  } catch (error) {
    figma.notify(`Error placing logo: ${error.message}`);
    return null;
  }
}

async function updateLogoPositions(frame, logos) {
  const existingLogos = frame.findAll(node => node.name.startsWith('Logo'));
  existingLogos.forEach(logo => logo.remove());
  
  const totalLogos = logos.length;
  const logoDimensions = logos.map(logo => {
    return calculateDimensions(logo.originalWidth, logo.originalHeight);
  });
  
  const logoWidths = logoDimensions.map(dim => dim.width);
  
  for (let i = 0; i < logos.length; i++) {
    const xPosition = calculatePosition(frame, i, totalLogos, logoWidths);
    await placeLogo(frame, logos[i], i, xPosition);
  }
}