import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Type, 
  Image as ImageIcon, 
  Layers, 
  Sparkles, 
  Download, 
  Trash2, 
  Copy, 
  Lock, 
  Unlock, 
  Eye, 
  EyeOff, 
  MoveUp, 
  MoveDown, 
  Plus, 
  ZoomIn, 
  ZoomOut, 
  Undo, 
  Redo, 
  Grid, 
  Upload, 
  Stamp, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Bold, 
  Italic, 
  X,
  Sliders,
  Check
} from 'lucide-react';
import { useToolTracking } from '../hooks/useToolTracking';

// Types
export type LayerType = 'text' | 'image' | 'stamp' | 'shape';

export type BlendMode = 
  | 'normal' 
  | 'multiply' 
  | 'screen' 
  | 'overlay' 
  | 'darken' 
  | 'lighten' 
  | 'color-dodge' 
  | 'color-burn' 
  | 'hard-light' 
  | 'soft-light' 
  | 'difference' 
  | 'exclusion';

export interface BaseLayer {
  id: string;
  name: string;
  type: LayerType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // degrees
  opacity: number; // 0 to 1
  blendMode: BlendMode;
  locked: boolean;
  visible: boolean;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
}

export interface TextLayer extends BaseLayer {
  type: 'text';
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  fontStyle: 'normal' | 'italic';
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  color: string;
  textAlign: 'left' | 'center' | 'right';
  letterSpacing: number;
  lineHeight: number;
  backgroundColor?: string;
  backgroundPadding?: number;
  backgroundRadius?: number;
  strokeColor?: string;
  strokeWidth?: number;
}

export interface ImageLayer extends BaseLayer {
  type: 'image' | 'stamp';
  src: string;
  imgElement?: HTMLImageElement;
  brightness: number; // 100 default
  contrast: number; // 100 default
  saturation: number; // 100 default
  blur: number; // 0 default
  hueRotate: number; // 0 default
  borderRadius: number;
  borderWidth?: number;
  borderColor?: string;
}

export type Layer = TextLayer | ImageLayer;

const FONT_OPTIONS = [
  { name: 'Verdana (Klassisch & Lesbar)', value: 'Verdana, sans-serif' },
  { name: 'Arial (Modern & Neutral)', value: 'Arial, sans-serif' },
  { name: 'Trebuchet MS', value: '"Trebuchet MS", sans-serif' },
  { name: 'Georgia (Eleganter Serif)', value: 'Georgia, serif' },
  { name: 'Impact (Plakat & Banner)', value: 'Impact, sans-serif' },
  { name: 'Courier New (Monospace)', value: '"Courier New", monospace' },
  { name: 'Times New Roman', value: '"Times New Roman", serif' },
  { name: 'Comic Sans MS', value: '"Comic Sans MS", cursive' },
  { name: 'Inter / System', value: 'system-ui, -apple-system, sans-serif' },
];

const BLEND_MODES: { label: string; value: BlendMode }[] = [
  { label: 'Normal (Standard)', value: 'normal' },
  { label: 'Multiply (Multiplizieren)', value: 'multiply' },
  { label: 'Screen (Negativ multiplizieren)', value: 'screen' },
  { label: 'Overlay (Ineinanderkopieren)', value: 'overlay' },
  { label: 'Darken (Abdunkeln)', value: 'darken' },
  { label: 'Lighten (Aufhellen)', value: 'lighten' },
  { label: 'Color Dodge (Farbig abwedeln)', value: 'color-dodge' },
  { label: 'Soft Light (Weiches Licht)', value: 'soft-light' },
  { label: 'Difference (Differenz)', value: 'difference' },
  { label: 'Exclusion (Ausschluss)', value: 'exclusion' },
];

const CANVAS_PRESETS = [
  { name: 'Freie Größe / Custom', width: 800, height: 600 },
  { name: 'Instagram Post (1:1)', width: 1080, height: 1080 },
  { name: 'Instagram Story (9:16)', width: 1080, height: 1920 },
  { name: 'Newsletter Banner (3:2)', width: 900, height: 600 },
  { name: 'Website Header (16:9)', width: 1200, height: 675 },
  { name: 'Facebook Cover', width: 1200, height: 630 },
];

const STAMP_PRESETS = [
  {
    name: '50% RABATT',
    color: '#EF4444',
    bg: '#FEF2F2',
    text: '50% RABATT',
    font: 'Impact, sans-serif'
  },
  {
    name: 'TOP SELLER',
    color: '#0059FF',
    bg: '#EFF6FF',
    text: '★ TOP SELLER ★',
    font: 'Verdana, sans-serif'
  },
  {
    name: 'LIMITED OFFER',
    color: '#F59E0B',
    bg: '#FFFBEB',
    text: '⚡ LIMITED OFFER',
    font: 'Arial, sans-serif'
  },
  {
    name: 'NEU / NEW',
    color: '#10B981',
    bg: '#ECFDF5',
    text: 'NEU',
    font: 'Verdana, sans-serif'
  },
  {
    name: 'CONFIDENTIAL',
    color: '#DC2626',
    bg: 'transparent',
    text: 'CONFIDENTIAL',
    font: 'Impact, sans-serif'
  },
  {
    name: 'WATERMARK LOGO',
    color: '#94A3B8',
    bg: 'transparent',
    text: '© YES MEDIA WATERMARK',
    font: 'Arial, sans-serif'
  }
];

export const ImageLabelingStudio: React.FC = () => {
  useToolTracking('Image Labeling Studio');

  // Canvas State
  const [canvasWidth, setCanvasWidth] = useState(800);
  const [canvasHeight, setCanvasHeight] = useState(600);
  const [bgImageSrc, setBgImageSrc] = useState<string | null>(null);
  const [bgImageElement, setBgImageElement] = useState<HTMLImageElement | null>(null);
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(false);
  const [copyNotification, setCopyNotification] = useState(false);

  // Layers State & Selection
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'text' | 'stamps' | 'bg' | 'layers'>('text');

  // History State for Undo / Redo
  const [history, setHistory] = useState<{ layers: Layer[]; bgImageSrc: string | null; bgColor: string }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const bgFileInputRef = useRef<HTMLInputElement>(null);
  const imageOverlayInputRef = useRef<HTMLInputElement>(null);

  // Dragging State
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [layerStartPos, setLayerStartPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Record History State
  const pushHistory = useCallback((newLayers: Layer[], newBgSrc = bgImageSrc, newBgColor = bgColor) => {
    const nextHistory = history.slice(0, historyIndex + 1);
    nextHistory.push({
      layers: JSON.parse(JSON.stringify(newLayers)),
      bgImageSrc: newBgSrc,
      bgColor: newBgColor
    });
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
  }, [history, historyIndex, bgImageSrc, bgColor]);

  // Initial setup
  useEffect(() => {
    if (layers.length === 0 && history.length === 0) {
      const initialTextLayer: TextLayer = {
        id: 'demo-text-1',
        name: 'Verdana Badge Label',
        type: 'text',
        text: 'PRODUKT HIGHLIGHT',
        fontFamily: 'Verdana, sans-serif',
        fontSize: 30,
        fontWeight: 'bold',
        fontStyle: 'normal', // Definitiv normal, nicht kursiv!
        color: '#FFFFFF',
        textAlign: 'center',
        letterSpacing: 1,
        lineHeight: 1.2,
        x: 240,
        y: 250,
        width: 320,
        height: 60,
        rotation: 0,
        opacity: 0.95,
        blendMode: 'normal',
        locked: false,
        visible: true,
        backgroundColor: '#0059FF',
        backgroundPadding: 14,
        backgroundRadius: 10,
        shadowColor: 'rgba(0,0,0,0.2)',
        shadowBlur: 8,
        shadowOffsetX: 0,
        shadowOffsetY: 4
      };
      
      const initialSubTextLayer: TextLayer = {
        id: 'demo-text-2',
        name: 'Arial Subtitle Label',
        type: 'text',
        text: 'Clean & Editable Image Labeling',
        fontFamily: 'Arial, sans-serif',
        fontSize: 20,
        fontWeight: 'normal',
        fontStyle: 'normal', // Normal by default!
        color: '#1E293B',
        textAlign: 'center',
        letterSpacing: 0,
        lineHeight: 1.3,
        x: 200,
        y: 330,
        width: 400,
        height: 40,
        rotation: 0,
        opacity: 0.85,
        blendMode: 'normal',
        locked: false,
        visible: true,
      };

      const initialLayers = [initialTextLayer, initialSubTextLayer];
      setLayers(initialLayers);
      setSelectedLayerId(initialTextLayer.id);
      
      setHistory([{
        layers: initialLayers,
        bgImageSrc: null,
        bgColor: '#F8FAFC'
      }]);
      setHistoryIndex(0);
    }
  }, []);

  // Handle Undo
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setLayers(JSON.parse(JSON.stringify(prev.layers)));
      setBgImageSrc(prev.bgImageSrc);
      setBgColor(prev.bgColor);
    }
  };

  // Handle Redo
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setLayers(JSON.parse(JSON.stringify(next.layers)));
      setBgImageSrc(next.bgImageSrc);
      setBgColor(next.bgColor);
    }
  };

  // Load Background Image Element
  useEffect(() => {
    if (bgImageSrc) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = bgImageSrc;
      img.onload = () => {
        setBgImageElement(img);
        if (img.width > 0 && img.height > 0) {
          let w = img.width;
          let h = img.height;
          if (w > 1600) {
            h = Math.round((h * 1600) / w);
            w = 1600;
          }
          setCanvasWidth(w);
          setCanvasHeight(h);
        }
      };
    } else {
      setBgImageElement(null);
    }
  }, [bgImageSrc]);

  // Main Canvas Rendering
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Fill Background Color
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Draw Background Image
    if (bgImageElement) {
      ctx.drawImage(bgImageElement, 0, 0, canvasWidth, canvasHeight);
    }

    // Draw Layers
    layers.forEach((layer) => {
      if (!layer.visible) return;

      ctx.save();
      ctx.globalAlpha = layer.opacity;
      ctx.globalCompositeOperation = layer.blendMode as GlobalCompositeOperation;

      if (layer.shadowColor && (layer.shadowBlur || 0) > 0) {
        ctx.shadowColor = layer.shadowColor;
        ctx.shadowBlur = layer.shadowBlur || 0;
        ctx.shadowOffsetX = layer.shadowOffsetX || 0;
        ctx.shadowOffsetY = layer.shadowOffsetY || 0;
      }

      const centerX = layer.x + layer.width / 2;
      const centerY = layer.y + layer.height / 2;

      ctx.translate(centerX, centerY);
      if (layer.rotation) {
        ctx.rotate((layer.rotation * Math.PI) / 180);
      }
      ctx.translate(-layer.width / 2, -layer.height / 2);

      if (layer.type === 'text') {
        renderTextLayer(ctx, layer as TextLayer);
      } else if (layer.type === 'image' || layer.type === 'stamp') {
        renderImageLayer(ctx, layer as ImageLayer);
      }

      ctx.restore();

      // Draw Selection Bounding Box
      if (layer.id === selectedLayerId && !layer.locked) {
        ctx.save();
        ctx.translate(centerX, centerY);
        if (layer.rotation) {
          ctx.rotate((layer.rotation * Math.PI) / 180);
        }
        ctx.translate(-layer.width / 2, -layer.height / 2);

        ctx.strokeStyle = '#0059FF';
        ctx.lineWidth = 2 / zoom;
        ctx.setLineDash([6 / zoom, 4 / zoom]);
        ctx.strokeRect(-4, -4, layer.width + 8, layer.height + 8);
        ctx.setLineDash([]);

        const cornerSize = 8 / zoom;
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#0059FF';
        ctx.lineWidth = 1.5 / zoom;

        [
          [-4, -4],
          [layer.width + 4, -4],
          [layer.width + 4, layer.height + 4],
          [-4, layer.height + 4]
        ].forEach(([cx, cy]) => {
          ctx.fillRect(cx - cornerSize / 2, cy - cornerSize / 2, cornerSize, cornerSize);
          ctx.strokeRect(cx - cornerSize / 2, cy - cornerSize / 2, cornerSize, cornerSize);
        });

        ctx.restore();
      }
    });

    // Draw Grid
    if (showGrid) {
      ctx.save();
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < canvasWidth; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvasHeight);
        ctx.stroke();
      }
      for (let y = 0; y < canvasHeight; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvasWidth, y);
        ctx.stroke();
      }
      ctx.restore();
    }

  }, [canvasWidth, canvasHeight, bgColor, bgImageElement, layers, selectedLayerId, zoom, showGrid]);

  // Render Text Layer onto Canvas
  const renderTextLayer = (ctx: CanvasRenderingContext2D, layer: TextLayer) => {
    const {
      text,
      fontFamily,
      fontSize,
      fontWeight = 'normal',
      fontStyle = 'normal', // Normal state, explicitly non-italic by default!
      textTransform = 'none',
      color,
      textAlign,
      width,
      height,
      backgroundColor,
      backgroundPadding = 12,
      backgroundRadius = 8,
      strokeColor,
      strokeWidth
    } = layer;

    // Apply Text Transform
    let processedText = text || ' ';
    if (textTransform === 'uppercase') {
      processedText = processedText.toUpperCase();
    } else if (textTransform === 'lowercase') {
      processedText = processedText.toLowerCase();
    } else if (textTransform === 'capitalize') {
      processedText = processedText.replace(/\b\w/g, char => char.toUpperCase());
    }

    // Construct valid font string
    const fontStr = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.font = fontStr;
    ctx.textBaseline = 'middle';

    const textMetrics = ctx.measureText(processedText);
    const calculatedTextWidth = textMetrics.width;

    // Background Badge Fill
    if (backgroundColor && backgroundColor !== 'transparent') {
      ctx.fillStyle = backgroundColor;
      const pad = backgroundPadding;
      const rectW = Math.max(width, calculatedTextWidth + pad * 2);
      const rectH = Math.max(height, fontSize + pad * 1.5);

      const rx = (width - rectW) / 2;
      const ry = (height - rectH) / 2;

      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(rx, ry, rectW, rectH, backgroundRadius);
      } else {
        ctx.rect(rx, ry, rectW, rectH);
      }
      ctx.fill();
    }

    let textX = width / 2;
    if (textAlign === 'left') textX = 0;
    if (textAlign === 'right') textX = width;
    ctx.textAlign = textAlign;

    if (strokeColor && strokeWidth && strokeWidth > 0) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      ctx.strokeText(processedText, textX, height / 2);
    }

    ctx.fillStyle = color;
    ctx.fillText(processedText, textX, height / 2);
  };

  // Render Image Layer onto Canvas
  const renderImageLayer = (ctx: CanvasRenderingContext2D, layer: ImageLayer) => {
    if (!layer.imgElement && layer.src) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = layer.src;
      img.onload = () => {
        layer.imgElement = img;
        renderCanvas();
      };
      return;
    }

    if (layer.imgElement) {
      const filters: string[] = [];
      if (layer.brightness !== 100) filters.push(`brightness(${layer.brightness}%)`);
      if (layer.contrast !== 100) filters.push(`contrast(${layer.contrast}%)`);
      if (layer.saturation !== 100) filters.push(`saturate(${layer.saturation}%)`);
      if (layer.blur > 0) filters.push(`blur(${layer.blur}px)`);
      if (layer.hueRotate > 0) filters.push(`hue-rotate(${layer.hueRotate}deg)`);

      if (filters.length > 0) {
        ctx.filter = filters.join(' ');
      }

      ctx.drawImage(layer.imgElement, 0, 0, layer.width, layer.height);
      ctx.filter = 'none';
    }
  };

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Add Text Layer
  const handleAddTextLayer = (
    initialText = 'Neuer Text Label', 
    font = 'Verdana, sans-serif',
    bg?: string
  ) => {
    const newLayer: TextLayer = {
      id: `text-${Date.now()}`,
      name: initialText.length > 18 ? initialText.substring(0, 15) + '...' : initialText,
      type: 'text',
      text: initialText,
      fontFamily: font,
      fontSize: 28,
      fontWeight: 'bold',
      fontStyle: 'normal', // Start in standard normal (non-italic)
      color: bg ? '#FFFFFF' : '#0F172A',
      textAlign: 'center',
      letterSpacing: 0,
      lineHeight: 1.2,
      x: canvasWidth / 2 - 150,
      y: canvasHeight / 2 - 25,
      width: 300,
      height: 50,
      rotation: 0,
      opacity: 1,
      blendMode: 'normal',
      locked: false,
      visible: true,
      backgroundColor: bg || 'transparent',
      backgroundPadding: bg ? 12 : 0,
      backgroundRadius: bg ? 8 : 0
    };

    const nextLayers = [...layers, newLayer];
    setLayers(nextLayers);
    setSelectedLayerId(newLayer.id);
    pushHistory(nextLayers);
  };

  // Add Stamp Preset
  const handleAddStampPreset = (preset: typeof STAMP_PRESETS[0]) => {
    const newLayer: TextLayer = {
      id: `stamp-${Date.now()}`,
      name: preset.name,
      type: 'text',
      text: preset.text,
      fontFamily: preset.font,
      fontSize: 26,
      fontWeight: 'bold',
      fontStyle: 'normal',
      color: preset.color,
      textAlign: 'center',
      letterSpacing: 1,
      lineHeight: 1.2,
      x: canvasWidth / 2 - 140,
      y: canvasHeight / 2 - 30,
      width: 280,
      height: 60,
      rotation: -6,
      opacity: 0.95,
      blendMode: 'normal',
      locked: false,
      visible: true,
      backgroundColor: preset.bg,
      backgroundPadding: 12,
      backgroundRadius: 10,
      shadowColor: 'rgba(0,0,0,0.15)',
      shadowBlur: 8,
      shadowOffsetX: 0,
      shadowOffsetY: 4
    };

    const nextLayers = [...layers, newLayer];
    setLayers(nextLayers);
    setSelectedLayerId(newLayer.id);
    pushHistory(nextLayers);
  };

  // Add Image Overlay
  const handleImageOverlayUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = src;
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        if (w > canvasWidth * 0.6) {
          h = Math.round((h * canvasWidth * 0.6) / w);
          w = canvasWidth * 0.6;
        }

        const newLayer: ImageLayer = {
          id: `img-${Date.now()}`,
          name: file.name.replace(/\.[^/.]+$/, ""),
          type: 'image',
          src,
          imgElement: img,
          x: canvasWidth / 2 - w / 2,
          y: canvasHeight / 2 - h / 2,
          width: w,
          height: h,
          rotation: 0,
          opacity: 1,
          blendMode: 'normal',
          locked: false,
          visible: true,
          brightness: 100,
          contrast: 100,
          saturation: 100,
          blur: 0,
          hueRotate: 0,
          borderRadius: 0
        };

        const nextLayers = [...layers, newLayer];
        setLayers(nextLayers);
        setSelectedLayerId(newLayer.id);
        pushHistory(nextLayers);
      };
    };
    reader.readAsDataURL(file);
    if (imageOverlayInputRef.current) imageOverlayInputRef.current.value = '';
  };

  // Background Upload
  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      setBgImageSrc(src);
      pushHistory(layers, src, bgColor);
    };
    reader.readAsDataURL(file);
    if (bgFileInputRef.current) bgFileInputRef.current.value = '';
  };

  const updateSelectedLayer = (updates: Partial<Layer>) => {
    if (!selectedLayerId) return;
    const nextLayers = layers.map(l => l.id === selectedLayerId ? { ...l, ...updates } as Layer : l);
    setLayers(nextLayers);
  };

  const moveLayerOrder = (id: string, direction: 'up' | 'down') => {
    const idx = layers.findIndex(l => l.id === id);
    if (idx === -1) return;
    if (direction === 'up' && idx < layers.length - 1) {
      const copy = [...layers];
      const temp = copy[idx];
      copy[idx] = copy[idx + 1];
      copy[idx + 1] = temp;
      setLayers(copy);
      pushHistory(copy);
    } else if (direction === 'down' && idx > 0) {
      const copy = [...layers];
      const temp = copy[idx];
      copy[idx] = copy[idx - 1];
      copy[idx - 1] = temp;
      setLayers(copy);
      pushHistory(copy);
    }
  };

  const deleteLayer = (id: string) => {
    const nextLayers = layers.filter(l => l.id !== id);
    setLayers(nextLayers);
    if (selectedLayerId === id) setSelectedLayerId(null);
    pushHistory(nextLayers);
  };

  const duplicateLayer = (id: string) => {
    const target = layers.find(l => l.id === id);
    if (!target) return;
    const clone: Layer = {
      ...JSON.parse(JSON.stringify(target)),
      id: `clone-${Date.now()}`,
      name: `${target.name} (Kopie)`,
      x: target.x + 20,
      y: target.y + 20
    };
    const nextLayers = [...layers, clone];
    setLayers(nextLayers);
    setSelectedLayerId(clone.id);
    pushHistory(nextLayers);
  };

  // Canvas Drag & Select Mouse Handlers
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / zoom;
    const mouseY = (e.clientY - rect.top) / zoom;

    for (let i = layers.length - 1; i >= 0; i--) {
      const l = layers[i];
      if (!l.visible || l.locked) continue;

      if (
        mouseX >= l.x - 10 &&
        mouseX <= l.x + l.width + 10 &&
        mouseY >= l.y - 10 &&
        mouseY <= l.y + l.height + 10
      ) {
        setSelectedLayerId(l.id);
        setIsDragging(true);
        setDragStartPos({ x: mouseX, y: mouseY });
        setLayerStartPos({ x: l.x, y: l.y });
        return;
      }
    }

    setSelectedLayerId(null);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !selectedLayerId) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / zoom;
    const mouseY = (e.clientY - rect.top) / zoom;

    const dx = mouseX - dragStartPos.x;
    const dy = mouseY - dragStartPos.y;

    updateSelectedLayer({
      x: Math.round(layerStartPos.x + dx),
      y: Math.round(layerStartPos.y + dy)
    });
  };

  const handleCanvasMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      pushHistory(layers);
    }
  };

  // Export & Copy Handlers
  const exportCanvasImage = (format: 'png' | 'jpeg' | 'webp', quality = 0.95) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const tempSelected = selectedLayerId;
    setSelectedLayerId(null);

    setTimeout(() => {
      renderCanvas();
      const mimeType = `image/${format}`;
      const dataUrl = canvas.toDataURL(mimeType, quality);

      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `image-label-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setSelectedLayerId(tempSelected);
    }, 50);
  };

  const copyCanvasToClipboard = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const tempSelected = selectedLayerId;
    setSelectedLayerId(null);

    setTimeout(() => {
      renderCanvas();
      canvas.toBlob(async (blob) => {
        if (blob) {
          try {
            await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
            setCopyNotification(true);
            setTimeout(() => setCopyNotification(false), 2000);
          } catch (err) {
            console.error('Clipboard copy failed:', err);
            alert('Kopieren in die Zwischenablage fehlgeschlagen.');
          }
        }
        setSelectedLayerId(tempSelected);
      }, 'image/png');
    }, 50);
  };

  const selectedLayer = layers.find(l => l.id === selectedLayerId);

  return (
    <div className="h-full w-full flex flex-col bg-[#FAFAFA] dark:bg-[#111111] text-black dark:text-white overflow-hidden select-none">
      
      {/* Top Main Navigation Bar - Styled matching App Theme */}
      <div className="h-14 border-b border-black/10 dark:border-white/10 bg-white dark:bg-[#1A1A1A] px-4 flex items-center justify-between gap-4 z-20 shadow-sm">
        
        {/* Left Title & Canvas Size Presets */}
        <div className="flex items-center gap-3 md:gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
              <Stamp size={20} />
            </div>
            <div>
              <h1 className="text-sm md:text-base font-extrabold tracking-tight text-black dark:text-white flex items-center gap-2">
                Image Labeling Studio
              </h1>
            </div>
          </div>

          <div className="h-5 w-px bg-black/10 dark:bg-white/10 hidden sm:block" />

          {/* Preset Canvas Selector */}
          <div className="hidden md:flex items-center gap-2">
            <span className="text-xs text-black/60 dark:text-white/60 font-medium">Format:</span>
            <select
              value={`${canvasWidth}x${canvasHeight}`}
              onChange={(e) => {
                const [w, h] = e.target.value.split('x').map(Number);
                setCanvasWidth(w);
                setCanvasHeight(h);
              }}
              className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs rounded-xl px-2.5 py-1.5 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              {CANVAS_PRESETS.map((p) => (
                <option key={p.name} value={`${p.width}x${p.height}`} className="bg-white dark:bg-[#1A1A1A]">
                  {p.name} ({p.width} × {p.height})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Center: Undo / Redo & Zoom & Grid */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="p-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-40 transition-all"
            title="Rückgängig"
          >
            <Undo size={16} />
          </button>
          <button
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="p-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-40 transition-all"
            title="Wiederholen"
          >
            <Redo size={16} />
          </button>

          <div className="h-4 w-px bg-black/10 dark:bg-white/10 mx-1" />

          <button
            onClick={() => setZoom(z => Math.max(0.3, Number((z - 0.1).toFixed(1))))}
            className="p-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-all"
            title="Herauszoomen"
          >
            <ZoomOut size={16} />
          </button>
          <span className="text-xs font-mono w-12 text-center text-black/60 dark:text-white/60 font-semibold">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom(z => Math.min(2.5, Number((z + 0.1).toFixed(1))))}
            className="p-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-all"
            title="Hineinzoomen"
          >
            <ZoomIn size={16} />
          </button>

          <div className="h-4 w-px bg-black/10 dark:bg-white/10 mx-1" />

          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-2 rounded-xl transition-all ${showGrid ? 'bg-blue-500 text-white shadow-sm' : 'bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-black/70 dark:text-white/70'}`}
            title="Raster anzeigen"
          >
            <Grid size={16} />
          </button>
        </div>

        {/* Right: Export Options */}
        <div className="flex items-center gap-2">
          <button
            onClick={copyCanvasToClipboard}
            className="px-3 py-1.5 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-xs font-bold transition-all flex items-center gap-1.5"
            title="In Zwischenablage kopieren"
          >
            {copyNotification ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            <span>{copyNotification ? 'Kopiert!' : 'Kopieren'}</span>
          </button>

          <button
            onClick={() => exportCanvasImage('png')}
            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 active:scale-95"
          >
            <Download size={14} /> PNG Speichern
          </button>
        </div>

      </div>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left Canva-Style Tool Selector Tabs */}
        <div className="w-16 bg-white dark:bg-[#1A1A1A] border-r border-black/10 dark:border-white/10 flex flex-col items-center py-4 gap-4 z-10 shadow-sm">
          <button
            onClick={() => setActiveTab('text')}
            className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-all ${
              activeTab === 'text' 
                ? 'bg-blue-500 text-white shadow-md' 
                : 'text-black/60 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/5 hover:text-black dark:hover:text-white'
            }`}
          >
            <Type size={18} />
            <span>Text</span>
          </button>

          <button
            onClick={() => setActiveTab('stamps')}
            className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-all ${
              activeTab === 'stamps' 
                ? 'bg-blue-500 text-white shadow-md' 
                : 'text-black/60 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/5 hover:text-black dark:hover:text-white'
            }`}
          >
            <Stamp size={18} />
            <span>Badges</span>
          </button>

          <button
            onClick={() => setActiveTab('bg')}
            className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-all ${
              activeTab === 'bg' 
                ? 'bg-blue-500 text-white shadow-md' 
                : 'text-black/60 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/5 hover:text-black dark:hover:text-white'
            }`}
          >
            <ImageIcon size={18} />
            <span>Hintergrund</span>
          </button>

          <button
            onClick={() => setActiveTab('layers')}
            className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-all relative ${
              activeTab === 'layers' 
                ? 'bg-blue-500 text-white shadow-md' 
                : 'text-black/60 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/5 hover:text-black dark:hover:text-white'
            }`}
          >
            <Layers size={18} />
            <span>Ebenen</span>
            {layers.length > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-indigo-500 text-white text-[9px] font-bold flex items-center justify-center">
                {layers.length}
              </span>
            )}
          </button>
        </div>

        {/* Left Expanded Drawer Content */}
        <div className="w-72 bg-white dark:bg-[#1A1A1A] border-r border-black/10 dark:border-white/10 p-4 flex flex-col gap-5 overflow-y-auto custom-scrollbar">
          
          {/* Text Tab */}
          {activeTab === 'text' && (
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="font-extrabold text-sm text-black dark:text-white">Text & Label hinzufügen</h3>
                <p className="text-xs text-black/60 dark:text-white/60 mt-0.5">Typografie mit wählbarem Stil (Normal & Kursiv)</p>
              </div>

              <div className="flex flex-col gap-2.5">
                <button
                  onClick={() => handleAddTextLayer('VERDANA HEADLINE', 'Verdana, sans-serif', '#0059FF')}
                  className="w-full p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/10 dark:border-white/10 text-left transition-all flex flex-col gap-1 group"
                >
                  <span className="font-bold text-sm text-blue-600 dark:text-blue-400 font-sans" style={{ fontFamily: 'Verdana, sans-serif' }}>
                    Verdana Badge Label
                  </span>
                  <span className="text-[11px] text-black/60 dark:text-white/60">Standard-Schnitt für prägnante Produkttexte</span>
                </button>

                <button
                  onClick={() => handleAddTextLayer('Arial Overlay Text', 'Arial, sans-serif')}
                  className="w-full p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/10 dark:border-white/10 text-left transition-all flex flex-col gap-1"
                >
                  <span className="font-bold text-sm text-black dark:text-white" style={{ fontFamily: 'Arial, sans-serif' }}>
                    Arial Overlay Text
                  </span>
                  <span className="text-[11px] text-black/60 dark:text-white/60">Klassische saubere Neutralschrift</span>
                </button>

                <button
                  onClick={() => handleAddTextLayer('IMPACT BANNER', 'Impact, sans-serif', '#EF4444')}
                  className="w-full p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/10 dark:border-white/10 text-left transition-all flex flex-col gap-1"
                >
                  <span className="font-black text-base text-red-500 uppercase tracking-wide" style={{ fontFamily: 'Impact, sans-serif' }}>
                    Impact Promo Banner
                  </span>
                  <span className="text-[11px] text-black/60 dark:text-white/60">Auffälliger Plakattext für Aktionen</span>
                </button>
              </div>

              <div className="pt-3 border-t border-black/10 dark:border-white/10">
                <button
                  onClick={() => handleAddTextLayer()}
                  className="w-full py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <Plus size={16} /> Freies Text-Element
                </button>
              </div>
            </div>
          )}

          {/* Stamps & Badges Tab */}
          {activeTab === 'stamps' && (
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="font-extrabold text-sm text-black dark:text-white">Fertige Stempel & Badges</h3>
                <p className="text-xs text-black/60 dark:text-white/60 mt-0.5">1-Klick Vorlagen für Shop & Marketing</p>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {STAMP_PRESETS.map((p) => (
                  <button
                    key={p.name}
                    onClick={() => handleAddStampPreset(p)}
                    className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/10 dark:border-white/10 flex items-center justify-between transition-all text-left"
                  >
                    <span 
                      className="px-2.5 py-1 rounded-lg text-xs font-bold" 
                      style={{ color: p.color, backgroundColor: p.bg === 'transparent' ? 'rgba(0,0,0,0.05)' : p.bg, fontFamily: p.font }}
                    >
                      {p.text}
                    </span>
                    <Plus size={14} className="text-black/40 dark:text-white/40" />
                  </button>
                ))}
              </div>

              <div className="pt-3 border-t border-black/10 dark:border-white/10">
                <label className="w-full py-2.5 rounded-xl border border-dashed border-black/20 dark:border-white/20 hover:border-blue-500 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer">
                  <Upload size={16} /> Bildoverlay hochladen
                  <input type="file" ref={imageOverlayInputRef} accept="image/*" onChange={handleImageOverlayUpload} className="hidden" />
                </label>
              </div>
            </div>
          )}

          {/* Background Upload Tab */}
          {activeTab === 'bg' && (
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="font-extrabold text-sm text-black dark:text-white">Hintergrundbild & Farbe</h3>
                <p className="text-xs text-black/60 dark:text-white/60 mt-0.5">Lade ein Hauptbild hoch oder wähle eine Farbe</p>
              </div>

              {/* Upload Dropzone */}
              <label className="border-2 border-dashed border-black/20 dark:border-white/20 hover:border-blue-500 bg-black/5 dark:bg-white/5 rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <Upload size={20} />
                </div>
                <div>
                  <span className="font-bold text-xs text-black dark:text-white block">Hintergrundbild wählen</span>
                  <span className="text-[11px] text-black/60 dark:text-white/60">JPG, PNG, WebP bis 4K</span>
                </div>
                <input type="file" ref={bgFileInputRef} accept="image/*" onChange={handleBgUpload} className="hidden" />
              </label>

              {bgImageSrc && (
                <button
                  onClick={() => {
                    setBgImageSrc(null);
                    pushHistory(layers, null, bgColor);
                  }}
                  className="w-full py-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <Trash2 size={14} /> Hintergrundbild entfernen
                </button>
              )}

              {/* Canvas Background Color */}
              <div className="flex flex-col gap-2 pt-2 border-t border-black/10 dark:border-white/10">
                <label className="text-xs font-bold text-black/80 dark:text-white/80">Hintergrundfarbe:</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="color" 
                    value={bgColor}
                    onChange={(e) => {
                      setBgColor(e.target.value);
                      pushHistory(layers, bgImageSrc, e.target.value);
                    }}
                    className="w-10 h-10 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 cursor-pointer p-1" 
                  />
                  <input 
                    type="text" 
                    value={bgColor} 
                    onChange={(e) => setBgColor(e.target.value)}
                    className="flex-1 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-black dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Layers Management Tab */}
          {activeTab === 'layers' && (
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="font-extrabold text-sm text-black dark:text-white">Ebenen-Hierarchie</h3>
                <p className="text-xs text-black/60 dark:text-white/60 mt-0.5">Verschieben, Sperren & Sichtbarkeit</p>
              </div>

              {layers.length === 0 ? (
                <div className="p-8 text-center text-xs text-black/40 dark:text-white/40 border border-dashed border-black/10 dark:border-white/10 rounded-2xl">
                  Keine Ebenen vorhanden.
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {[...layers].reverse().map((layer) => (
                    <div
                      key={layer.id}
                      onClick={() => setSelectedLayerId(layer.id)}
                      className={`p-2.5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                        selectedLayerId === layer.id 
                          ? 'bg-blue-500/10 border-blue-500 text-blue-600 dark:text-blue-400 font-bold' 
                          : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-black/80 dark:text-white/80 hover:bg-black/10 dark:hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        {layer.type === 'text' ? <Type size={14} className="text-blue-500" /> : <ImageIcon size={14} className="text-indigo-500" />}
                        <span className="text-xs font-medium truncate max-w-[120px]">{layer.name}</span>
                      </div>

                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => updateSelectedLayer({ visible: !layer.visible })}
                          className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-black/60 dark:text-white/60"
                        >
                          {layer.visible ? <Eye size={13} /> : <EyeOff size={13} className="text-black/30 dark:text-white/30" />}
                        </button>
                        <button
                          onClick={() => updateSelectedLayer({ locked: !layer.locked })}
                          className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-black/60 dark:text-white/60"
                        >
                          {layer.locked ? <Lock size={13} className="text-amber-500" /> : <Unlock size={13} />}
                        </button>
                        <button
                          onClick={() => moveLayerOrder(layer.id, 'up')}
                          className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-black/60 dark:text-white/60"
                          title="Nach vorne"
                        >
                          <MoveUp size={13} />
                        </button>
                        <button
                          onClick={() => moveLayerOrder(layer.id, 'down')}
                          className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-black/60 dark:text-white/60"
                          title="Nach hinten"
                        >
                          <MoveDown size={13} />
                        </button>
                        <button
                          onClick={() => deleteLayer(layer.id)}
                          className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Center Canvas Viewport */}
        <div 
          ref={containerRef}
          className="flex-1 bg-[#F1F5F9] dark:bg-[#090D16] overflow-auto flex items-center justify-center p-8 relative custom-scrollbar"
        >
          <div 
            style={{ 
              transform: `scale(${zoom})`,
              transformOrigin: 'center center',
              transition: 'transform 0.15s ease-out'
            }}
            className="shadow-xl rounded-xl overflow-hidden border border-black/10 dark:border-white/10 bg-white"
          >
            <canvas
              ref={canvasRef}
              width={canvasWidth}
              height={canvasHeight}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
              className="cursor-crosshair block"
            />
          </div>
        </div>

        {/* Right Inspector Panel (Properties, Editable Fonts, Italic Toggle & Blending) */}
        <div className="w-80 bg-white dark:bg-[#1A1A1A] border-l border-black/10 dark:border-white/10 p-4 flex flex-col gap-5 overflow-y-auto custom-scrollbar z-10 shadow-sm">
          
          {selectedLayer ? (
            <div className="flex flex-col gap-5">
              
              {/* Layer Title & Quick Actions */}
              <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500">Ebene Bearbeiten</span>
                  <h3 className="font-extrabold text-sm text-black dark:text-white truncate max-w-[180px]">{selectedLayer.name}</h3>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => duplicateLayer(selectedLayer.id)}
                    className="p-1.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-black/70 dark:text-white/70"
                    title="Duplizieren"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    onClick={() => deleteLayer(selectedLayer.id)}
                    className="p-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500"
                    title="Löschen"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Blending & Transparency Controls */}
              <div className="flex flex-col gap-3 bg-black/5 dark:bg-white/5 p-3.5 rounded-2xl border border-black/10 dark:border-white/10">
                <span className="text-xs font-bold text-black dark:text-white flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-500" /> Transparenz & Blending
                </span>

                {/* Opacity Slider */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs text-black/60 dark:text-white/60 font-medium">
                    <span>Deckkraft (Transparenz):</span>
                    <span className="font-mono text-black dark:text-white font-bold">{Math.round(selectedLayer.opacity * 100)}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.01"
                    value={selectedLayer.opacity}
                    onChange={(e) => updateSelectedLayer({ opacity: Number(e.target.value) })}
                    onMouseUp={() => pushHistory(layers)}
                    className="w-full accent-blue-500 cursor-pointer" 
                  />
                </div>

                {/* Blend Mode Dropdown */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-black/60 dark:text-white/60 font-medium">Mischmodus (Blend Mode):</label>
                  <select
                    value={selectedLayer.blendMode}
                    onChange={(e) => {
                      updateSelectedLayer({ blendMode: e.target.value as BlendMode });
                      pushHistory(layers);
                    }}
                    className="w-full bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {BLEND_MODES.map((bm) => (
                      <option key={bm.value} value={bm.value}>{bm.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Text Layer Inspector (Full typography editing, italic toggle, weight, font family) */}
              {selectedLayer.type === 'text' && (
                <div className="flex flex-col gap-4">
                  
                  {/* Text Input */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-black/80 dark:text-white/80">Text Inhalt:</label>
                    <input 
                      type="text" 
                      value={(selectedLayer as TextLayer).text}
                      onChange={(e) => updateSelectedLayer({ text: e.target.value, name: e.target.value })}
                      onBlur={() => pushHistory(layers)}
                      className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>

                  {/* Font Family Selector (Verdana & Arial Prominent) */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-black/80 dark:text-white/80">Schriftart (Font Family):</label>
                    <select
                      value={(selectedLayer as TextLayer).fontFamily}
                      onChange={(e) => {
                        updateSelectedLayer({ fontFamily: e.target.value });
                        pushHistory(layers);
                      }}
                      className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    >
                      {FONT_OPTIONS.map((f) => (
                        <option key={f.value} value={f.value} className="bg-white dark:bg-[#1A1A1A]">{f.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Quick Format Toolbar: Bold & Italic & Align */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-black/80 dark:text-white/80">Formatierung & Stil:</label>
                    <div className="flex items-center gap-1.5 bg-black/5 dark:bg-white/5 p-1.5 rounded-xl border border-black/10 dark:border-white/10">
                      
                      {/* Bold Toggle */}
                      <button
                        type="button"
                        onClick={() => {
                          const currentWeight = (selectedLayer as TextLayer).fontWeight;
                          const nextWeight = currentWeight === 'bold' ? 'normal' : 'bold';
                          updateSelectedLayer({ fontWeight: nextWeight });
                          pushHistory(layers);
                        }}
                        className={`p-2 rounded-lg text-xs font-bold flex-1 flex items-center justify-center gap-1 transition-all ${
                          (selectedLayer as TextLayer).fontWeight === 'bold' || (selectedLayer as TextLayer).fontWeight === '900'
                            ? 'bg-blue-500 text-white shadow-sm'
                            : 'text-black/70 dark:text-white/70 hover:bg-black/10 dark:hover:bg-white/10'
                        }`}
                        title="Fett (Bold)"
                      >
                        <Bold size={14} /> Fett
                      </button>

                      {/* Italic Toggle (User Requested: Easily Editable Kursiv!) */}
                      <button
                        type="button"
                        onClick={() => {
                          const currentStyle = (selectedLayer as TextLayer).fontStyle || 'normal';
                          const nextStyle = currentStyle === 'italic' ? 'normal' : 'italic';
                          updateSelectedLayer({ fontStyle: nextStyle });
                          pushHistory(layers);
                        }}
                        className={`p-2 rounded-lg text-xs font-bold flex-1 flex items-center justify-center gap-1 transition-all ${
                          (selectedLayer as TextLayer).fontStyle === 'italic'
                            ? 'bg-blue-500 text-white shadow-sm'
                            : 'text-black/70 dark:text-white/70 hover:bg-black/10 dark:hover:bg-white/10'
                        }`}
                        title="Kursiv (Italic) an/aus"
                      >
                        <Italic size={14} /> Kursiv
                      </button>

                    </div>
                  </div>

                  {/* Text Transform Toolbar (Uppercase, Lowercase, Capitalize, Normal) */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-black/80 dark:text-white/80">Text-Transformation:</label>
                    <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 p-1.5 rounded-xl border border-black/10 dark:border-white/10">
                      <button
                        type="button"
                        onClick={() => {
                          updateSelectedLayer({ textTransform: 'none' });
                          pushHistory(layers);
                        }}
                        className={`py-1.5 px-2 rounded-lg text-xs font-medium flex-1 transition-all text-center ${
                          !(selectedLayer as TextLayer).textTransform || (selectedLayer as TextLayer).textTransform === 'none'
                            ? 'bg-blue-500 text-white font-bold shadow-sm'
                            : 'text-black/70 dark:text-white/70 hover:bg-black/10 dark:hover:bg-white/10'
                        }`}
                        title="Standard (Normal)"
                      >
                        Aa
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          updateSelectedLayer({ textTransform: 'uppercase' });
                          pushHistory(layers);
                        }}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold flex-1 transition-all text-center ${
                          (selectedLayer as TextLayer).textTransform === 'uppercase'
                            ? 'bg-blue-500 text-white font-bold shadow-sm'
                            : 'text-black/70 dark:text-white/70 hover:bg-black/10 dark:hover:bg-white/10'
                        }`}
                        title="GROSSBUCHSTABEN (Uppercase)"
                      >
                        AA
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          updateSelectedLayer({ textTransform: 'lowercase' });
                          pushHistory(layers);
                        }}
                        className={`py-1.5 px-2 rounded-lg text-xs font-medium flex-1 transition-all text-center ${
                          (selectedLayer as TextLayer).textTransform === 'lowercase'
                            ? 'bg-blue-500 text-white font-bold shadow-sm'
                            : 'text-black/70 dark:text-white/70 hover:bg-black/10 dark:hover:bg-white/10'
                        }`}
                        title="kleinbuchstaben (Lowercase)"
                      >
                        aa
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          updateSelectedLayer({ textTransform: 'capitalize' });
                          pushHistory(layers);
                        }}
                        className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex-1 transition-all text-center ${
                          (selectedLayer as TextLayer).textTransform === 'capitalize'
                            ? 'bg-blue-500 text-white font-bold shadow-sm'
                            : 'text-black/70 dark:text-white/70 hover:bg-black/10 dark:hover:bg-white/10'
                        }`}
                        title="Große Anfangsbuchstaben (Capitalize)"
                      >
                        Ab
                      </button>
                    </div>
                  </div>

                  {/* Size & Weight */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-black/60 dark:text-white/60">Größe (px):</label>
                      <input 
                        type="number" 
                        min="8" 
                        max="200"
                        value={(selectedLayer as TextLayer).fontSize}
                        onChange={(e) => updateSelectedLayer({ fontSize: Number(e.target.value) })}
                        onBlur={() => pushHistory(layers)}
                        className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-black dark:text-white font-mono"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-black/60 dark:text-white/60">Schriftschnitt:</label>
                      <select
                        value={(selectedLayer as TextLayer).fontWeight}
                        onChange={(e) => {
                          updateSelectedLayer({ fontWeight: e.target.value });
                          pushHistory(layers);
                        }}
                        className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-black dark:text-white"
                      >
                        <option value="normal" className="bg-white dark:bg-[#1A1A1A]">Normal</option>
                        <option value="bold" className="bg-white dark:bg-[#1A1A1A]">Fett (Bold)</option>
                        <option value="900" className="bg-white dark:bg-[#1A1A1A]">Extra Bold</option>
                      </select>
                    </div>
                  </div>

                  {/* Text Color & Background Badge Color */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-black/60 dark:text-white/60">Textfarbe:</label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="color" 
                          value={(selectedLayer as TextLayer).color}
                          onChange={(e) => updateSelectedLayer({ color: e.target.value })}
                          className="w-8 h-8 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 cursor-pointer p-0.5"
                        />
                        <span className="text-[11px] font-mono text-black/80 dark:text-white/80">{(selectedLayer as TextLayer).color}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-black/60 dark:text-white/60">Badge Hülle (BG):</label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="color" 
                          value={(selectedLayer as TextLayer).backgroundColor || '#0059FF'}
                          onChange={(e) => updateSelectedLayer({ backgroundColor: e.target.value })}
                          className="w-8 h-8 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 cursor-pointer p-0.5"
                        />
                        <button
                          onClick={() => updateSelectedLayer({ backgroundColor: 'transparent' })}
                          className="text-[10px] text-black/60 dark:text-white/60 hover:underline"
                        >
                          Keine
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Badge Radius & Padding */}
                  {(selectedLayer as TextLayer).backgroundColor !== 'transparent' && (
                    <div className="grid grid-cols-2 gap-3 bg-black/5 dark:bg-white/5 p-2.5 rounded-xl border border-black/10 dark:border-white/10">
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] text-black/60 dark:text-white/60">Padding:</label>
                        <input 
                          type="number" 
                          min="0"
                          max="50"
                          value={(selectedLayer as TextLayer).backgroundPadding || 12}
                          onChange={(e) => updateSelectedLayer({ backgroundPadding: Number(e.target.value) })}
                          className="bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-lg px-2 py-1 text-xs text-black dark:text-white"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] text-black/60 dark:text-white/60">Eckenradius:</label>
                        <input 
                          type="number" 
                          min="0"
                          max="40"
                          value={(selectedLayer as TextLayer).backgroundRadius || 8}
                          onChange={(e) => updateSelectedLayer({ backgroundRadius: Number(e.target.value) })}
                          className="bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-lg px-2 py-1 text-xs text-black dark:text-white"
                        />
                      </div>
                    </div>
                  )}

                  {/* Alignment */}
                  <div className="flex items-center justify-between bg-black/5 dark:bg-white/5 p-2 rounded-xl border border-black/10 dark:border-white/10">
                    <span className="text-xs text-black/60 dark:text-white/60">Ausrichtung:</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateSelectedLayer({ textAlign: 'left' })}
                        className={`p-1.5 rounded-lg ${ (selectedLayer as TextLayer).textAlign === 'left' ? 'bg-blue-500 text-white shadow-sm' : 'text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white'}`}
                      >
                        <AlignLeft size={14} />
                      </button>
                      <button
                        onClick={() => updateSelectedLayer({ textAlign: 'center' })}
                        className={`p-1.5 rounded-lg ${ (selectedLayer as TextLayer).textAlign === 'center' ? 'bg-blue-500 text-white shadow-sm' : 'text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white'}`}
                      >
                        <AlignCenter size={14} />
                      </button>
                      <button
                        onClick={() => updateSelectedLayer({ textAlign: 'right' })}
                        className={`p-1.5 rounded-lg ${ (selectedLayer as TextLayer).textAlign === 'right' ? 'bg-blue-500 text-white shadow-sm' : 'text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white'}`}
                      >
                        <AlignRight size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Shadow & Depth Adjustments */}
                  <div className="flex flex-col gap-3 bg-black/5 dark:bg-white/5 p-3 rounded-2xl border border-black/10 dark:border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-black dark:text-white">Schlagschatten & Tiefe:</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedLayer.shadowBlur && selectedLayer.shadowBlur > 0) {
                            updateSelectedLayer({ shadowBlur: 0, shadowOffsetY: 0, shadowColor: 'transparent' });
                          } else {
                            updateSelectedLayer({ shadowBlur: 10, shadowOffsetY: 4, shadowColor: 'rgba(0,0,0,0.3)' });
                          }
                          pushHistory(layers);
                        }}
                        className="text-[10px] font-bold text-blue-500 hover:underline"
                      >
                        {selectedLayer.shadowBlur && selectedLayer.shadowBlur > 0 ? 'Schatten entfernen' : 'Schatten hinzufügen'}
                      </button>
                    </div>

                    {/* Shadow Blur Slider */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-[11px] text-black/60 dark:text-white/60 font-medium">
                        <span>Weichzeichnung (Blur Radius):</span>
                        <span className="font-mono text-black dark:text-white">{selectedLayer.shadowBlur || 0}px</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="40" 
                        step="1"
                        value={selectedLayer.shadowBlur || 0}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          updateSelectedLayer({ 
                            shadowBlur: val,
                            shadowColor: selectedLayer.shadowColor && selectedLayer.shadowColor !== 'transparent' ? selectedLayer.shadowColor : 'rgba(0,0,0,0.3)'
                          });
                        }}
                        onMouseUp={() => pushHistory(layers)}
                        className="w-full accent-blue-500 cursor-pointer" 
                      />
                    </div>

                    {/* Shadow Offset Y Slider */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-[11px] text-black/60 dark:text-white/60 font-medium">
                        <span>Schatten-Versatz (Vertikale Tiefe):</span>
                        <span className="font-mono text-black dark:text-white">{selectedLayer.shadowOffsetY || 0}px</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="30" 
                        step="1"
                        value={selectedLayer.shadowOffsetY || 0}
                        onChange={(e) => updateSelectedLayer({ shadowOffsetY: Number(e.target.value) })}
                        onMouseUp={() => pushHistory(layers)}
                        className="w-full accent-blue-500 cursor-pointer" 
                      />
                    </div>

                    {/* Shadow Color */}
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-black/5 dark:border-white/5">
                      <span className="text-[11px] text-black/60 dark:text-white/60">Schattenfarbe:</span>
                      <div className="flex items-center gap-2">
                        <input 
                          type="color"
                          value={selectedLayer.shadowColor && selectedLayer.shadowColor.startsWith('#') ? selectedLayer.shadowColor : '#000000'}
                          onChange={(e) => updateSelectedLayer({ shadowColor: e.target.value })}
                          onBlur={() => pushHistory(layers)}
                          className="w-7 h-7 rounded-lg border border-black/10 dark:border-white/10 cursor-pointer p-0.5"
                        />
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* Image Layer Filters */}
              {(selectedLayer.type === 'image' || selectedLayer.type === 'stamp') && (
                <div className="flex flex-col gap-3 bg-black/5 dark:bg-white/5 p-3 rounded-2xl border border-black/10 dark:border-white/10">
                  <span className="text-xs font-bold text-black dark:text-white">Bildfilter & Anpassungen:</span>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs text-black/60 dark:text-white/60">
                      <span>Helligkeit:</span>
                      <span>{(selectedLayer as ImageLayer).brightness}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="200" 
                      value={(selectedLayer as ImageLayer).brightness || 100}
                      onChange={(e) => updateSelectedLayer({ brightness: Number(e.target.value) })}
                      className="w-full accent-blue-500" 
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs text-black/60 dark:text-white/60">
                      <span>Kontrast:</span>
                      <span>{(selectedLayer as ImageLayer).contrast}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="200" 
                      value={(selectedLayer as ImageLayer).contrast || 100}
                      onChange={(e) => updateSelectedLayer({ contrast: Number(e.target.value) })}
                      className="w-full accent-blue-500" 
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs text-black/60 dark:text-white/60">
                      <span>Sättigung:</span>
                      <span>{(selectedLayer as ImageLayer).saturation}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="200" 
                      value={(selectedLayer as ImageLayer).saturation || 100}
                      onChange={(e) => updateSelectedLayer({ saturation: Number(e.target.value) })}
                      className="w-full accent-blue-500" 
                    />
                  </div>
                </div>
              )}

              {/* Transform (Rotation & Size) */}
              <div className="flex flex-col gap-3 pt-3 border-t border-black/10 dark:border-white/10">
                <span className="text-xs font-bold text-black/80 dark:text-white/80">Transformation:</span>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] text-black/60 dark:text-white/60">Rotation (°):</label>
                    <input 
                      type="number" 
                      min="-180" 
                      max="180"
                      value={selectedLayer.rotation}
                      onChange={(e) => updateSelectedLayer({ rotation: Number(e.target.value) })}
                      onBlur={() => pushHistory(layers)}
                      className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-black dark:text-white font-mono"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] text-black/60 dark:text-white/60">Breite (px):</label>
                    <input 
                      type="number" 
                      min="10"
                      value={selectedLayer.width}
                      onChange={(e) => updateSelectedLayer({ width: Math.max(10, Number(e.target.value)) })}
                      onBlur={() => pushHistory(layers)}
                      className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-black dark:text-white font-mono"
                    />
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-black/40 dark:text-white/40 gap-3">
              <MoveUp size={32} className="opacity-40 animate-bounce" />
              <p className="text-xs font-medium">
                Klicke auf ein Element im Canvas, um Transparenz, Font (Verdana/Arial), Kursiv-Stil oder Blending anzupassen.
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default ImageLabelingStudio;
