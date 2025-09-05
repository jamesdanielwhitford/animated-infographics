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
    const canvas = document.getElementById('canvas');
    canvas.innerHTML = canvas.innerHTML.split('</defs>')[0] + '</defs>';
    
    frames[currentFrame].elements.forEach(element => {
        const nodeToClone = element.node || element;
        if (nodeToClone && typeof nodeToClone.cloneNode === 'function') {
            canvas.appendChild(nodeToClone.cloneNode(true));
        }
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
    let isDragging = false;
    let startPos = { x: 0, y: 0 };
    
    element.addEventListener('mousedown', (e) => {
        isDragging = true;
        const rect = document.getElementById('canvas').getBoundingClientRect();
        startPos.x = e.clientX - rect.left;
        startPos.y = e.clientY - rect.top;
        e.preventDefault();
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        const rect = document.getElementById('canvas').getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const dx = x - startPos.x;
        const dy = y - startPos.y;
        
        if (element.tagName === 'circle') {
            const cx = parseFloat(element.getAttribute('cx')) + dx;
            const cy = parseFloat(element.getAttribute('cy')) + dy;
            element.setAttribute('cx', cx);
            element.setAttribute('cy', cy);
        } else if (element.tagName === 'rect') {
            const rectX = parseFloat(element.getAttribute('x')) + dx;
            const rectY = parseFloat(element.getAttribute('y')) + dy;
            element.setAttribute('x', rectX);
            element.setAttribute('y', rectY);
        } else if (element.tagName === 'text') {
            const textX = parseFloat(element.getAttribute('x')) + dx;
            const textY = parseFloat(element.getAttribute('y')) + dy;
            element.setAttribute('x', textX);
            element.setAttribute('y', textY);
        } else if (element.tagName === 'path') {
            const path = element.getAttribute('d');
            const newPath = path.replace(/(\d+\.?\d*)/g, (match, number) => {
                return parseFloat(number) + (match.includes('M') || match.includes('L') ? dx : dy);
            });
            element.setAttribute('d', newPath);
        }
        
        startPos.x = x;
        startPos.y = y;
    });
    
    document.addEventListener('mouseup', () => {
        if (isDragging) {
            updateFrameElements();
        }
        isDragging = false;
    });
}

function updateFrameElements() {
    const canvas = document.getElementById('canvas');
    frames[currentFrame].elements = [];
    
    canvas.querySelectorAll('.draggable').forEach(element => {
        if (element && typeof element.cloneNode === 'function') {
            frames[currentFrame].elements.push({
                id: element.id,
                node: element.cloneNode(true),
                shape: element.getAttribute('data-shape') || element.tagName.toLowerCase()
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
    
    // D3.js Test - Add a test circle to verify D3 is working
    testD3Integration();
});

// D3.js Integration Test
function testD3Integration() {
    // Test if D3 is loaded
    if (typeof d3 === 'undefined') {
        console.error('D3.js not loaded!');
        return;
    }
    
    console.log('D3.js loaded successfully! Version:', d3.version);
    
    // Create a test circle using D3 in top-right corner
    const svg = d3.select('#canvas');
    
    // Add a test circle that fades in to verify D3 transitions work
    svg.append('circle')
        .attr('cx', 750)
        .attr('cy', 50)
        .attr('r', 20)
        .attr('fill', '#ff6b6b')
        .attr('stroke', '#ff5252')
        .attr('stroke-width', 2)
        .attr('opacity', 0)
        .transition()
        .duration(2000)
        .attr('opacity', 0.8);
        
    // Add test label
    svg.append('text')
        .attr('x', 750)
        .attr('y', 85)
        .attr('text-anchor', 'middle')
        .attr('font-family', 'Arial, sans-serif')
        .attr('font-size', '12px')
        .attr('fill', '#666')
        .text('D3 Test');
}