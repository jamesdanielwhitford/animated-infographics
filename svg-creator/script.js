let frames = [{ elements: [] }];
let currentFrame = 0;
let elementCounter = 0;

function addNewFrame() {
    // Properly duplicate the frame by cloning DOM nodes instead of JSON serialization
    const lastFrame = frames[frames.length - 1];
    const newFrame = {
        elements: lastFrame.elements.map(element => ({
            id: element.id,
            node: element.node && element.node.cloneNode ? element.node.cloneNode(true) : null,
            shape: element.shape
        }))
    };
    frames.push(newFrame);
    
    const frameToolbar = document.querySelector('.frame-toolbar');
    const addBtn = frameToolbar.querySelector('.add-frame-btn');
    
    const frameTab = document.createElement('div');
    const frameIndex = frames.length - 1; // Capture the frame index at creation time
    frameTab.className = 'frame-tab';
    frameTab.textContent = `Frame ${frames.length}`;
    frameTab.setAttribute('data-frame', frameIndex);
    frameTab.onclick = () => switchToFrame(frameIndex); // Use the captured value
    
    frameToolbar.insertBefore(frameTab, addBtn);
}

function switchToFrame(frameIndex) {
    document.querySelectorAll('.frame-tab').forEach((tab, index) => {
        tab.classList.toggle('active', index === frameIndex);
    });
    
    currentFrame = frameIndex;
    renderCanvas();
}

function renderCanvas() {
    const svg = d3.select('#canvas');
    
    // Clear all draggable elements first to avoid conflicts
    svg.selectAll('.draggable').remove();
    
    const currentElements = frames[currentFrame].elements;
    
    // Convert frame elements to D3-friendly data format
    const elementsData = currentElements.map(element => {
        const node = element.node || element;
        if (!node) return null;
        
        // Extract element data for D3 binding
        const elementData = {
            id: element.id,
            shape: element.shape,
            tagName: node.tagName,
            attributes: {}
        };
        
        // Copy all attributes
        if (node.attributes) {
            for (let attr of node.attributes) {
                if (attr.name !== 'class') { // Skip class as we'll handle it separately
                    elementData.attributes[attr.name] = attr.value;
                }
            }
        }
        
        // Handle text content
        if (node.tagName === 'text') {
            elementData.textContent = node.textContent;
        }
        
        return elementData;
    }).filter(Boolean); // Remove null entries
    
    // Create all elements fresh (simpler than complex data joins for frame switching)
    elementsData.forEach(d => {
        let element;
        
        // Create element based on type
        switch(d.tagName) {
            case 'circle':
                element = svg.append('circle');
                break;
            case 'rect':
                element = svg.append('rect');
                break;
            case 'text':
                element = svg.append('text');
                break;
            case 'path':
                element = svg.append('path');
                break;
        }
        
        // Apply all attributes
        Object.entries(d.attributes).forEach(([key, value]) => {
            element.attr(key, value);
        });
        
        // Handle text content
        if (d.textContent) {
            element.text(d.textContent);
        }
        
        // Apply classes and make draggable
        element
            .classed('draggable', true)
            .datum(d);
            
        // Apply drag behavior
        makeDraggable(element.node());
    });
}

function createSVGElement(shape, x, y) {
    const id = `element_${elementCounter++}`;
    const svg = d3.select('#canvas');
    let d3Element;
    
    // Create element data object for D3 binding
    const elementData = { id, shape, x, y };
    
    switch(shape) {
        case 'circle':
            d3Element = svg.append('circle')
                .datum(elementData)
                .attr('id', id)
                .attr('cx', x)
                .attr('cy', y)
                .attr('r', 30)
                .attr('fill', '#007bff')
                .attr('stroke', '#0056b3')
                .attr('stroke-width', 2)
                .classed('draggable', true);
            break;
            
        case 'rectangle':
            d3Element = svg.append('rect')
                .datum(elementData)
                .attr('id', id)
                .attr('x', x - 40)
                .attr('y', y - 25)
                .attr('width', 80)
                .attr('height', 50)
                .attr('fill', '#28a745')
                .attr('stroke', '#1e7e34')
                .attr('stroke-width', 2)
                .attr('rx', 4)
                .classed('draggable', true);
            break;
            
        case 'text':
            d3Element = svg.append('text')
                .datum(elementData)
                .attr('id', id)
                .attr('x', x)
                .attr('y', y)
                .attr('text-anchor', 'middle')
                .attr('dominant-baseline', 'middle')
                .attr('fill', '#333')
                .attr('font-family', 'Arial, sans-serif')
                .attr('font-size', 16)
                .text('Sample Text')
                .classed('draggable', true);
            break;
            
        case 'arrow':
            d3Element = svg.append('path')
                .datum(elementData)
                .attr('id', id)
                .attr('d', `M ${x-40} ${y} L ${x+40} ${y} M ${x+30} ${y-10} L ${x+40} ${y} L ${x+30} ${y+10}`)
                .attr('stroke', '#dc3545')
                .attr('stroke-width', 3)
                .attr('fill', 'none')
                .attr('stroke-linecap', 'round')
                .classed('draggable', true);
            break;
            
        case 'box':
            d3Element = svg.append('rect')
                .datum(elementData)
                .attr('id', id)
                .attr('x', x - 60)
                .attr('y', y - 30)
                .attr('width', 120)
                .attr('height', 60)
                .attr('fill', '#6f42c1')
                .attr('stroke', '#5a32a3')
                .attr('stroke-width', 2)
                .attr('rx', 8)
                .classed('draggable', true);
            break;
    }
    
    // Get the DOM node to maintain compatibility with existing code
    const element = d3Element.node();
    makeDraggable(element);
    
    return { id, node: element, shape };
}

function makeDraggable(element) {
    // Use D3's drag behavior for smoother dragging
    const dragBehavior = d3.drag()
        .on('start', function(event) {
            // Change cursor and add visual feedback
            d3.select(this).style('cursor', 'grabbing');
        })
        .on('drag', function(event) {
            const element = this;
            const dx = event.dx;
            const dy = event.dy;
            
            // Update element position based on type
            if (element.tagName === 'circle') {
                const cx = parseFloat(element.getAttribute('cx')) + dx;
                const cy = parseFloat(element.getAttribute('cy')) + dy;
                d3.select(element)
                    .attr('cx', cx)
                    .attr('cy', cy);
            } else if (element.tagName === 'rect') {
                const x = parseFloat(element.getAttribute('x')) + dx;
                const y = parseFloat(element.getAttribute('y')) + dy;
                d3.select(element)
                    .attr('x', x)
                    .attr('y', y);
            } else if (element.tagName === 'text') {
                const x = parseFloat(element.getAttribute('x')) + dx;
                const y = parseFloat(element.getAttribute('y')) + dy;
                d3.select(element)
                    .attr('x', x)
                    .attr('y', y);
            } else if (element.tagName === 'path') {
                // Handle path dragging by updating all coordinates
                const path = element.getAttribute('d');
                const newPath = path.replace(/([ML])\s*([0-9.-]+)\s+([0-9.-]+)/g, (match, command, x, y) => {
                    return `${command} ${parseFloat(x) + dx} ${parseFloat(y) + dy}`;
                });
                d3.select(element).attr('d', newPath);
            }
        })
        .on('end', function(event) {
            // Reset cursor and add subtle settle animation
            d3.select(this)
                .style('cursor', 'grab')
                .transition()
                .duration(150)
                .ease(d3.easeBackOut.overshoot(1.2))
                .attr('transform', 'scale(1)'); // Subtle settle effect
            
            updateFrameElements();
        });
    
    // Apply drag behavior to the element
    d3.select(element).call(dragBehavior);
}

function updateFrameElements() {
    const svg = d3.select('#canvas');
    frames[currentFrame].elements = [];
    
    // Use D3 to collect current elements with their data
    svg.selectAll('.draggable').each(function() {
        const element = this;
        const d3Element = d3.select(element);
        
        if (element && typeof element.cloneNode === 'function') {
            frames[currentFrame].elements.push({
                id: element.id,
                node: element.cloneNode(true),
                shape: element.tagName.toLowerCase(),
                data: d3Element.datum() // Preserve D3 data binding
            });
        }
    });
}

function getElementPosition(element) {
    const node = element.node || element;
    
    // More detailed debugging for invalid nodes
    if (!node) {
        console.warn('getElementPosition: Node is null/undefined', element);
        return { x: 0, y: 0 };
    }
    
    if (!node.tagName) {
        console.warn('getElementPosition: Node missing tagName (likely corrupted DOM node)', {
            element,
            nodeType: typeof node,
            nodeKeys: Object.keys(node),
            node
        });
        return { x: 0, y: 0 };
    }
    
    if (typeof node.getAttribute !== 'function') {
        console.warn('getElementPosition: Node missing getAttribute method (not a proper DOM element)', {
            element,
            node,
            nodeType: typeof node
        });
        return { x: 0, y: 0 };
    }
    
    let x, y;
    
    if (node.tagName === 'circle') {
        x = parseFloat(node.getAttribute('cx'));
        y = parseFloat(node.getAttribute('cy'));
    } else if (node.tagName === 'rect') {
        x = parseFloat(node.getAttribute('x'));
        y = parseFloat(node.getAttribute('y'));
    } else if (node.tagName === 'text') {
        x = parseFloat(node.getAttribute('x'));
        y = parseFloat(node.getAttribute('y'));
    } else if (node.tagName === 'path') {
        const d = node.getAttribute('d');
        const match = d && d.match(/M\s*([0-9.-]+)\s+([0-9.-]+)/);
        if (match) {
            x = parseFloat(match[1]);
            y = parseFloat(match[2]);
        }
    }
    
    // Validate the extracted coordinates
    if (isNaN(x) || isNaN(y)) {
        console.warn('getElementPosition: Could not extract valid coordinates from element', {
            element,
            tagName: node.tagName,
            x, y,
            attributes: {
                cx: node.getAttribute('cx'),
                cy: node.getAttribute('cy'),
                x: node.getAttribute('x'),
                y: node.getAttribute('y'),
                d: node.getAttribute('d')
            }
        });
        return { x: 0, y: 0 };
    }
    
    return { x, y };
}

function compareFrames(frame1, frame2) {
    const changes = {
        added: [],
        removed: [],
        moved: [],
        unchanged: []
    };

    const frame1Ids = new Set(frame1.elements.map(el => el.id));
    const frame2Ids = new Set(frame2.elements.map(el => el.id));

    frame2.elements.forEach(element => {
        if (!frame1Ids.has(element.id)) {
            changes.added.push(element);
        } else {
            const frame1Element = frame1.elements.find(el => el.id === element.id);
            const pos1 = getElementPosition(frame1Element);
            const pos2 = getElementPosition(element);
            
            if (Math.abs(pos1.x - pos2.x) > 1 || Math.abs(pos1.y - pos2.y) > 1) {
                changes.moved.push({ from: frame1Element, to: element });
            } else {
                changes.unchanged.push(element);
            }
        }
    });

    frame1.elements.forEach(element => {
        if (!frame2Ids.has(element.id)) {
            changes.removed.push(element);
        }
    });

    return changes;
}

function generateAnimations() {
    if (frames.length < 2) return [];

    const animations = [];
    const frameDuration = 3000;

    for (let i = 1; i < frames.length; i++) {
        const changes = compareFrames(frames[i - 1], frames[i]);
        const startTime = i * frameDuration; // Fixed: should be i * frameDuration, not (i-1)

        changes.added.forEach(element => {
            animations.push({
                elementId: element.id,
                type: 'fadeIn',
                startTime: startTime,
                duration: frameDuration / 2,
                element: element
            });
        });

        changes.removed.forEach(element => {
            animations.push({
                elementId: element.id,
                type: 'fadeOut',
                startTime: startTime,
                duration: frameDuration / 2,
                element: element
            });
        });

        changes.moved.forEach(movement => {
            const fromPos = getElementPosition(movement.from);
            const toPos = getElementPosition(movement.to);
            
            animations.push({
                elementId: movement.from.id,
                type: 'move',
                startTime: startTime,
                duration: frameDuration,
                fromPos: fromPos,
                toPos: toPos,
                element: movement.to
            });
        });
    }

    return animations;
}

function createAnimatedSVG() {
    const svgWidth = 800;
    const svgHeight = 600;

    let svgContent = `<svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">`;
    
    const animations = generateAnimations();
    const allElements = new Map();

    // Collect all elements and track their lifecycle (first and last appearance)
    frames.forEach((frame, frameIndex) => {
        frame.elements.forEach(element => {
            if (!allElements.has(element.id)) {
                // First time seeing this element
                const elementWithContext = {
                    ...element,
                    firstFrameIndex: frameIndex,
                    lastFrameIndex: frameIndex,
                    originalPosition: getElementPosition(element)
                };
                allElements.set(element.id, elementWithContext);
            } else {
                // Update the last frame where this element appears
                const existingElement = allElements.get(element.id);
                existingElement.lastFrameIndex = frameIndex;
                allElements.set(element.id, existingElement);
            }
        });
    });

    allElements.forEach(element => {
        const elementAnimations = animations.filter(anim => anim.elementId === element.id);
        const nodeToUse = element.node || element;
        if (!nodeToUse || !nodeToUse.outerHTML) return;
        
        // Ensure element has valid position before proceeding
        const currentPos = getElementPosition(element);
        if (currentPos.x === 0 && currentPos.y === 0 && element.originalPosition) {
            console.warn('Element position seems invalid, using original position:', {
                elementId: element.id,
                currentPos,
                originalPos: element.originalPosition
            });
        }
        
        let elementSVG = nodeToUse.outerHTML.replace(/class="[^"]*"/g, '');
        
        // Add initial opacity if element doesn't start in frame 0
        const hasFadeInAnimation = elementAnimations.some(anim => anim.type === 'fadeIn');
        if (element.firstFrameIndex > 0 && hasFadeInAnimation) {
            // Set initial opacity to 0, will be animated to 1 by fadeIn animation
            elementSVG = elementSVG.replace(/(<[^>]+)/, '$1 opacity="0"');
        }
        
        // Add animations container if there are animations
        if (elementAnimations.length > 0) {
            const closingTag = elementSVG.match(/<\/[^>]+>$/);
            const openingTag = elementSVG.replace(closingTag ? closingTag[0] : /\/>$/, '');
            
            let animationsHTML = '';
            
            // Remove this conflicting logic - let generateAnimations() handle all timing
            
            elementAnimations.forEach(anim => {
                if (anim.type === 'fadeIn') {
                    animationsHTML += `<animate attributeName="opacity" values="0;1" dur="${anim.duration}ms" begin="${anim.startTime}ms" fill="freeze"/>`;
                } else if (anim.type === 'fadeOut') {
                    animationsHTML += `<animate attributeName="opacity" values="1;0" dur="${anim.duration}ms" begin="${anim.startTime}ms" fill="freeze"/>`;
                } else if (anim.type === 'move') {
                    if (element.node.tagName === 'circle') {
                        animationsHTML += `<animate attributeName="cx" values="${anim.fromPos.x};${anim.toPos.x}" dur="${anim.duration}ms" begin="${anim.startTime}ms" fill="freeze"/>`;
                        animationsHTML += `<animate attributeName="cy" values="${anim.fromPos.y};${anim.toPos.y}" dur="${anim.duration}ms" begin="${anim.startTime}ms" fill="freeze"/>`;
                    } else if (element.node.tagName === 'rect') {
                        animationsHTML += `<animate attributeName="x" values="${anim.fromPos.x};${anim.toPos.x}" dur="${anim.duration}ms" begin="${anim.startTime}ms" fill="freeze"/>`;
                        animationsHTML += `<animate attributeName="y" values="${anim.fromPos.y};${anim.toPos.y}" dur="${anim.duration}ms" begin="${anim.startTime}ms" fill="freeze"/>`;
                    } else if (element.node.tagName === 'text') {
                        animationsHTML += `<animate attributeName="x" values="${anim.fromPos.x};${anim.toPos.x}" dur="${anim.duration}ms" begin="${anim.startTime}ms" fill="freeze"/>`;
                        animationsHTML += `<animate attributeName="y" values="${anim.fromPos.y};${anim.toPos.y}" dur="${anim.duration}ms" begin="${anim.startTime}ms" fill="freeze"/>`;
                    }
                }
            });

            if (closingTag) {
                elementSVG = openingTag + '>' + animationsHTML + closingTag[0];
            } else {
                elementSVG = openingTag + '>' + animationsHTML + '</' + element.node.tagName + '>';
            }
        }

        svgContent += elementSVG;
    });

    svgContent += '</svg>';
    return svgContent;
}

function exportAnimation() {
    if (frames.length === 0) {
        alert('No frames to export!');
        return;
    }

    const svgContent = createAnimatedSVG();
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'animated-diagram.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Initialize drag and drop functionality
document.addEventListener('DOMContentLoaded', function() {
    // Fix Frame 1 navigation - add onclick handler to initial frame tab
    document.querySelectorAll('.frame-tab').forEach((tab, index) => {
        tab.onclick = () => switchToFrame(index);
    });

    document.querySelectorAll('.svg-element').forEach(element => {
        element.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', element.getAttribute('data-shape'));
        });
    });

    document.getElementById('canvas').addEventListener('dragover', (e) => {
        e.preventDefault();
    });

    document.getElementById('canvas').addEventListener('drop', (e) => {
        e.preventDefault();
        const shape = e.dataTransfer.getData('text/plain');
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const svgElement = createSVGElement(shape, x, y);
        document.getElementById('canvas').appendChild(svgElement.node);
        frames[currentFrame].elements.push(svgElement);
    });

    renderCanvas();
});