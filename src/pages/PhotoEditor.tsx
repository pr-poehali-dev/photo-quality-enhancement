import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface EnhancementSettings {
  brightness: number;
  contrast: number;
  sharpness: number;
}

export default function PhotoEditor() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEnhanced, setIsEnhanced] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [settings, setSettings] = useState<EnhancementSettings>({
    brightness: 110,
    contrast: 120,
    sharpness: 130,
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      loadImage(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      loadImage(file);
    }
  };

  const loadImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string);
      setIsEnhanced(false);
      setSliderPosition(50);
    };
    reader.readAsDataURL(file);
  };

  const applyEnhancements = () => {
    if (!selectedImage || !canvasRef.current) return;

    setIsProcessing(true);

    const img = new Image();
    img.onload = () => {
      originalImageRef.current = img;
      
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext('2d')!;
      
      canvas.width = img.width;
      canvas.height = img.height;
      
      ctx.filter = `brightness(${settings.brightness}%) contrast(${settings.contrast}%) saturate(110%)`;
      ctx.drawImage(img, 0, 0);
      
      if (settings.sharpness > 100) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const sharpened = applySharpen(imageData, (settings.sharpness - 100) / 100);
        ctx.putImageData(sharpened, 0, 0);
      }

      setTimeout(() => {
        setIsProcessing(false);
        setIsEnhanced(true);
      }, 1500);
    };
    img.src = selectedImage;
  };

  const applySharpen = (imageData: ImageData, amount: number): ImageData => {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const output = new ImageData(width, height);
    
    const kernel = [
      0, -amount, 0,
      -amount, 1 + 4 * amount, -amount,
      0, -amount, 0
    ];

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        for (let c = 0; c < 3; c++) {
          let sum = 0;
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const idx = ((y + ky) * width + (x + kx)) * 4 + c;
              const kidx = (ky + 1) * 3 + (kx + 1);
              sum += data[idx] * kernel[kidx];
            }
          }
          const outIdx = (y * width + x) * 4 + c;
          output.data[outIdx] = Math.max(0, Math.min(255, sum));
        }
        output.data[(y * width + x) * 4 + 3] = 255;
      }
    }
    
    return output;
  };

  const downloadImage = () => {
    if (!canvasRef.current) return;
    
    const link = document.createElement('a');
    link.download = 'enhanced-photo.png';
    link.href = canvasRef.current.toDataURL();
    link.click();
  };

  const resetImage = () => {
    setSelectedImage(null);
    setIsEnhanced(false);
    setSliderPosition(50);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100 px-6 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#0EA5E9] rounded-lg flex items-center justify-center">
              <Icon name="Sparkles" size={24} className="text-white" />
            </div>
            <h1 className="text-2xl font-semibold text-[#222222]">PhotoAI</h1>
          </div>
          
          {selectedImage && (
            <Button 
              variant="ghost" 
              onClick={resetImage}
              className="text-gray-600 hover:text-[#222222]"
            >
              <Icon name="X" size={20} className="mr-2" />
              Закрыть
            </Button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {!selectedImage ? (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-[#222222] mb-4">
                Улучшите качество фото
              </h2>
              <p className="text-lg text-gray-600">
                AI технология автоматически повысит резкость, контрастность и яркость
              </p>
            </div>

            <Card
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-16 text-center transition-all cursor-pointer hover:border-[#0EA5E9] ${
                isDragging ? 'border-[#0EA5E9] bg-blue-50' : 'border-gray-200'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex flex-col items-center gap-6">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                  <Icon name="Upload" size={40} className="text-gray-400" />
                </div>
                
                <div>
                  <p className="text-xl font-medium text-[#222222] mb-2">
                    Перетащите фото сюда
                  </p>
                  <p className="text-gray-500">
                    или нажмите для выбора файла
                  </p>
                </div>

                <Button className="bg-[#0EA5E9] hover:bg-[#0284C7] text-white px-8 py-6 text-lg rounded-xl">
                  Выбрать фото
                </Button>
              </div>
            </Card>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        ) : (
          <div className="space-y-8">
            <div className="relative bg-gray-50 rounded-2xl overflow-hidden" style={{ minHeight: '500px' }}>
              {isEnhanced ? (
                <div className="relative w-full h-full">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <img
                      src={selectedImage}
                      alt="Original"
                      className="max-w-full max-h-[600px] object-contain"
                    />
                  </div>
                  
                  <div 
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                  >
                    <canvas
                      ref={canvasRef}
                      className="max-w-full max-h-[600px] object-contain"
                    />
                  </div>

                  <div 
                    className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg cursor-ew-resize z-10"
                    style={{ left: `${sliderPosition}%` }}
                    onMouseDown={(e) => {
                      const startX = e.clientX;
                      const startPos = sliderPosition;
                      
                      const handleMouseMove = (e: MouseEvent) => {
                        const container = e.currentTarget as HTMLElement;
                        const rect = container.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        const percent = (x / rect.width) * 100;
                        setSliderPosition(Math.max(0, Math.min(100, percent)));
                      };

                      const handleMouseUp = () => {
                        document.removeEventListener('mousemove', handleMouseMove as any);
                        document.removeEventListener('mouseup', handleMouseUp);
                      };

                      document.addEventListener('mousemove', handleMouseMove as any);
                      document.addEventListener('mouseup', handleMouseUp);
                    }}
                  >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center">
                      <Icon name="GripVertical" size={24} className="text-gray-600" />
                    </div>
                  </div>

                  <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur px-4 py-2 rounded-lg text-sm font-medium text-[#222222]">
                    До
                  </div>
                  <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur px-4 py-2 rounded-lg text-sm font-medium text-[#0EA5E9]">
                    После
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center min-h-[500px]">
                  <img
                    src={selectedImage}
                    alt="Preview"
                    className="max-w-full max-h-[600px] object-contain"
                  />
                </div>
              )}
            </div>

            <Card className="p-8 rounded-2xl">
              <h3 className="text-xl font-semibold text-[#222222] mb-6">
                Настройки улучшения
              </h3>
              
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Icon name="Sun" size={18} />
                      Яркость
                    </label>
                    <span className="text-sm font-medium text-[#0EA5E9]">{settings.brightness}%</span>
                  </div>
                  <Slider
                    value={[settings.brightness]}
                    onValueChange={([value]) => setSettings({ ...settings, brightness: value })}
                    min={80}
                    max={140}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Icon name="Circle" size={18} />
                      Контрастность
                    </label>
                    <span className="text-sm font-medium text-[#0EA5E9]">{settings.contrast}%</span>
                  </div>
                  <Slider
                    value={[settings.contrast]}
                    onValueChange={([value]) => setSettings({ ...settings, contrast: value })}
                    min={80}
                    max={160}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Icon name="Focus" size={18} />
                      Резкость
                    </label>
                    <span className="text-sm font-medium text-[#0EA5E9]">{settings.sharpness}%</span>
                  </div>
                  <Slider
                    value={[settings.sharpness]}
                    onValueChange={([value]) => setSettings({ ...settings, sharpness: value })}
                    min={100}
                    max={200}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                {!isEnhanced ? (
                  <Button
                    onClick={applyEnhancements}
                    disabled={isProcessing}
                    className="flex-1 bg-[#0EA5E9] hover:bg-[#0284C7] text-white py-6 text-lg rounded-xl"
                  >
                    {isProcessing ? (
                      <>
                        <Icon name="Loader2" size={20} className="mr-2 animate-spin" />
                        Обработка...
                      </>
                    ) : (
                      <>
                        <Icon name="Wand2" size={20} className="mr-2" />
                        Улучшить фото
                      </>
                    )}
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={downloadImage}
                      className="flex-1 bg-[#0EA5E9] hover:bg-[#0284C7] text-white py-6 text-lg rounded-xl"
                    >
                      <Icon name="Download" size={20} className="mr-2" />
                      Скачать
                    </Button>
                    <Button
                      onClick={() => setIsEnhanced(false)}
                      variant="outline"
                      className="flex-1 border-2 py-6 text-lg rounded-xl"
                    >
                      <Icon name="RotateCcw" size={20} className="mr-2" />
                      Изменить настройки
                    </Button>
                  </>
                )}
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
