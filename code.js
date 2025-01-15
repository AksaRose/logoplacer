// Show plugin UI
figma.showUI(__html__, { width: 300, height: 400 });

let uploadedLogos = [];
const MAX_LOGOS = 4;
const LOGO_SIZE = 40; // Fixed size 40x40
const EDGE_PADDING = 20; // Padding from frame edges

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
      uploadedLogos.push(image);
      updateLogoPositions(frame, uploadedLogos);
      
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

function updateLogoPositions(frame, logos) {
  // Remove existing logos
  const existingLogos = frame.findAll(node => node.name.startsWith('Logo'));
  existingLogos.forEach(logo => logo.remove());
  
  const totalLogos = logos.length;
  const availableWidth = frame.width - (2 * EDGE_PADDING);
  
  logos.forEach((image, index) => {
    const xPosition = calculatePosition(frame, index, totalLogos);
    placeLogo(frame, image, index, xPosition);
  });
}

function calculatePosition(frame, index, totalLogos) {
  const leftPosition = EDGE_PADDING;
  const rightPosition = frame.width - EDGE_PADDING - LOGO_SIZE;
  
  switch(totalLogos) {
    case 1:
      // Single logo goes to left
      return leftPosition;
      
    case 2:
      // Two logos: left and right
      return index === 0 ? leftPosition : rightPosition;
      
    case 3:
    case 4:
      // For both 3 and 4 logos: equal spacing
      const spacing = (frame.width - (2 * EDGE_PADDING) - (LOGO_SIZE * totalLogos)) / (totalLogos - 1);
      return EDGE_PADDING + (index * (LOGO_SIZE + spacing));
  }
}

function placeLogo(frame, image, index, xPosition) {
  const logo = figma.createRectangle();
  logo.name = `Logo ${index + 1}`;
  logo.resize(LOGO_SIZE, LOGO_SIZE);
  
  // Fill the rectangle with the image
  logo.fills = [{
    type: 'IMAGE',
    imageHash: image.hash,
    scaleMode: 'FILL'
  }];
  
  // Center vertically and position horizontally
  logo.y = (frame.height - LOGO_SIZE) / 2;
  logo.x = xPosition;
  
  frame.appendChild(logo);
}