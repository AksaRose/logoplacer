figma.showUI(__html__, { width: 300, height: 400 });

// Store logos per frame using frame IDs as keys
let frameLogos = {};
const MAX_LOGOS = 4;
let lastSelectedFrameIds = [];

// Calculate padding and max dimensions as percentages of frame size
function getFrameConstants(frame) {
  const edgePaddingPercent = 0.05; // 5% of frame width
  const maxWidthPercent = 0.25; // 25% of frame width
  const maxHeightPercent = 0.1; // 10% of frame height
  
  return {
    EDGE_PADDING: Math.max(10, frame.width * edgePaddingPercent),
    MAX_WIDTH: Math.max(60, frame.width * maxWidthPercent),
    MAX_HEIGHT: Math.max(20, frame.height * maxHeightPercent)
  };
}

function calculateDimensions(frame, originalWidth, originalHeight) {
  const { MAX_WIDTH, MAX_HEIGHT } = getFrameConstants(frame);
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
  const { EDGE_PADDING } = getFrameConstants(frame);
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

// Check for frame selection changes
figma.on('selectionchange', () => {
  const currentSelection = figma.currentPage.selection;
  const currentFrames = currentSelection.filter(node => node.type === 'FRAME');
  
  // Get current frame IDs
  const currentFrameIds = currentFrames.map(frame => frame.id);
  
  // If we had previous frames and selection changed to different frames
  if (lastSelectedFrameIds.length > 0 && 
      (currentFrameIds.length !== lastSelectedFrameIds.length || 
       !currentFrameIds.every(id => lastSelectedFrameIds.includes(id)))) {
    
    // Show reminder notification
    figma.notify("Don't forget to reset logos when changing frames!", { timeout: 3000 });
  }
  
  // Update the last selected frame IDs
  lastSelectedFrameIds = currentFrameIds;
});

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'upload-logo') {
    const selection = figma.currentPage.selection;
    const frames = selection.filter(node => node.type === 'FRAME');
    
    if (frames.length === 0) {
      figma.notify('Please select at least one frame');
      return;
    }

    try {
      const image = figma.createImage(msg.imageData);
      const dimensions = msg.dimensions;
      const logoData = {
        image: image,
        originalWidth: dimensions.width,
        originalHeight: dimensions.height
      };
      
      // Check if any frame already has the maximum number of logos
      let framesAtMaxCapacity = 0;
      for (const frame of frames) {
        const frameId = frame.id;
        if (!frameLogos[frameId]) {
          frameLogos[frameId] = [];
        }
        
        if (frameLogos[frameId].length >= MAX_LOGOS) {
          framesAtMaxCapacity++;
        }
      }
      
      // If all selected frames are at max capacity, notify user
      if (framesAtMaxCapacity === frames.length) {
        figma.notify('All selected frames already have the maximum number of logos');
        return;
      }
      
      // Add the logo to each frame that has room
      let updatedFramesCount = 0;
      for (const frame of frames) {
        const frameId = frame.id;
        
        // Skip frames that already have max logos
        if (frameLogos[frameId].length >= MAX_LOGOS) continue;
        
        // Add logo to this frame
        frameLogos[frameId].push(logoData);
        await updateLogoPositions(frame, frameLogos[frameId]);
        updatedFramesCount++;
      }
      
      // Find the logo count from the first selected frame
      const selectedFrameId = frames[0].id;
      const logoCount = frameLogos[selectedFrameId] ? frameLogos[selectedFrameId].length : 0;
      
      // Update UI with the correct count from the first selected frame
      figma.ui.postMessage({ 
        type: 'update-count', 
        count: logoCount
      });
      
      figma.notify(`Logo added to ${updatedFramesCount} frame(s)`);
      
      // Check if the selected frames are now at max capacity
      if (logoCount >= MAX_LOGOS) {
        figma.ui.postMessage({ type: 'max-logos-reached' });
      }
    } catch (error) {
      figma.notify('Error placing logo: ' + error.message);
    }
  } else if (msg.type === 'reset') {
    const selection = figma.currentPage.selection;
    const frames = selection.filter(node => node.type === 'FRAME');
    
    if (frames.length === 0) {
      figma.notify('Please select at least one frame to reset');
      return;
    }
    
    // Clear logos from all selected frames
    let totalLogosRemoved = 0;
    for (const frame of frames) {
      const frameId = frame.id;
      if (frameLogos[frameId]) {
        totalLogosRemoved += frameLogos[frameId].length;
        // Properly remove the frame from tracking
        delete frameLogos[frameId];
      }
      
      const logos = frame.findAll(node => node.name.startsWith('Logo'));
      logos.forEach(logo => logo.remove());
    }
    
    // Reset the count in UI to 0
    figma.ui.postMessage({ type: 'reset-count' });
    
    figma.notify(`Reset successful. Removed logos from ${frames.length} frame(s).`);
  }
};

async function placeLogo(frame, logoData, index, xPosition) {
  const logo = figma.createRectangle();
  logo.name = `Logo ${index + 1}`;
  
  try {
    const { originalWidth, originalHeight } = logoData;
    const { width: newWidth, height: newHeight } = calculateDimensions(frame, originalWidth, originalHeight);
    
    logo.resize(newWidth, newHeight);
    logo.fills = [{
      type: 'IMAGE',
      imageHash: logoData.image.hash,
      scaleMode: 'FILL'
    }];
    
    const { EDGE_PADDING } = getFrameConstants(frame);
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
    return calculateDimensions(frame, logo.originalWidth, logo.originalHeight);
  });
  
  const logoWidths = logoDimensions.map(dim => dim.width);
  
  for (let i = 0; i < logos.length; i++) {
    const xPosition = calculatePosition(frame, i, totalLogos, logoWidths);
    await placeLogo(frame, logos[i], i, xPosition);
  }
}