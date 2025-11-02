import React, { useRef, useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

interface AnalogVUMeterProps {
  level: number; // 0-100 scale
  calibration?: number; // 0-100 scale for sensitivity adjustment
  onCalibrationChange?: (value: number) => void;
}

export const AnalogVUMeter = ({ 
  level, 
  calibration = 50,
  onCalibrationChange 
}: AnalogVUMeterProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [needlePosition, setNeedlePosition] = useState(0);
  const [needleVelocity, setNeedleVelocity] = useState(0);
  const [peakIndicator, setPeakIndicator] = useState(false);
  const [clipIndicator, setClipIndicator] = useState(false);

  // Convert 0-100 level to dB scale (-20 to +3)
  const levelToDb = (rawLevel: number, cal: number): number => {
    if (rawLevel === 0) return -20;
    // Apply calibration (50 = normal, higher = more sensitive)
    const adjustedLevel = rawLevel * (cal / 50);
    const clampedLevel = Math.min(100, adjustedLevel);
    return -20 + (clampedLevel / 100) * 23; // Maps to -20 to +3 dB
  };

  // Animate needle with spring physics
  useEffect(() => {
    let animationFrameId: number;
    const targetDb = levelToDb(level, calibration);
    
    const animate = () => {
      setNeedlePosition(current => {
        setNeedleVelocity(velocity => {
          const spring = 0.18; // Spring constant
          const damping = 0.65; // Damping factor (lower = more bounce)
          const force = (targetDb - current) * spring;
          const newVelocity = (velocity + force) * damping;
          return newVelocity;
        });
        
        return current + needleVelocity;
      });
      
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animate();
    return () => cancelAnimationFrame(animationFrameId);
  }, [level, calibration, needleVelocity]);

  // Update indicators
  useEffect(() => {
    const db = levelToDb(level, calibration);
    setPeakIndicator(db > 0);
    setClipIndicator(db > 1);
  }, [level, calibration]);

  // Draw the analog meter
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height - 40;
    const radius = Math.min(width, height) * 0.7;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    // Draw meter face (arc)
    const startAngle = Math.PI * 0.75;
    const endAngle = Math.PI * 0.25;

    // Meter face background
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.lineTo(centerX, centerY);
    ctx.closePath();
    ctx.fill();

    // Draw color zones
    const drawZone = (start: number, end: number, color: string) => {
      const startAngleZone = startAngle + (start / 23) * (endAngle - startAngle);
      const endAngleZone = startAngle + (end / 23) * (endAngle - startAngle);
      
      const gradient = ctx.createRadialGradient(centerX, centerY, radius * 0.7, centerX, centerY, radius * 0.95);
      gradient.addColorStop(0, color + '40');
      gradient.addColorStop(1, color);
      
      ctx.strokeStyle = gradient;
      ctx.lineWidth = radius * 0.12;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 0.85, startAngleZone, endAngleZone);
      ctx.stroke();
    };

    // Green zone: -20 to 0 dB
    drawZone(0, 20, '#22c55e');
    // Yellow/Orange zone: 0 to +1 dB
    drawZone(20, 21, '#f59e0b');
    // Red zone: +1 to +3 dB
    drawZone(21, 23, '#ef4444');

    // Draw tick marks and labels
    ctx.strokeStyle = '#e5e5e5';
    ctx.fillStyle = '#e5e5e5';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const dbMarks = [-20, -10, -7, -5, -3, -1, 0, +1, +2, +3];
    dbMarks.forEach(db => {
      const normalizedDb = db + 20; // Convert to 0-23 scale
      const angle = startAngle + (normalizedDb / 23) * (endAngle - startAngle);
      
      const tickLength = db % 10 === 0 || db === 0 ? 20 : 12;
      const x1 = centerX + (radius * 0.75) * Math.cos(angle);
      const y1 = centerY + (radius * 0.75) * Math.sin(angle);
      const x2 = centerX + (radius * 0.75 - tickLength) * Math.cos(angle);
      const y2 = centerY + (radius * 0.75 - tickLength) * Math.sin(angle);
      
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      
      // Draw labels for major marks
      if (db % 5 === 0 || db === 0 || db === +1 || db === +3) {
        const labelX = centerX + (radius * 0.55) * Math.cos(angle);
        const labelY = centerY + (radius * 0.55) * Math.sin(angle);
        ctx.fillText(db > 0 ? `+${db}` : `${db}`, labelX, labelY);
      }
    });

    // Draw needle
    const needleAngle = startAngle + ((needlePosition + 20) / 23) * (endAngle - startAngle);
    const needleLength = radius * 0.7;
    
    // Needle shadow
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(centerX + 2, centerY + 2);
    ctx.lineTo(
      centerX + needleLength * Math.cos(needleAngle) + 2,
      centerY + needleLength * Math.sin(needleAngle) + 2
    );
    ctx.stroke();

    // Needle main body
    const gradient = ctx.createLinearGradient(
      centerX, centerY,
      centerX + needleLength * Math.cos(needleAngle),
      centerY + needleLength * Math.sin(needleAngle)
    );
    gradient.addColorStop(0, '#fb923c');
    gradient.addColorStop(1, '#f97316');
    
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
      centerX + needleLength * Math.cos(needleAngle),
      centerY + needleLength * Math.sin(needleAngle)
    );
    ctx.stroke();

    // Needle center pivot
    ctx.fillStyle = '#3f3f46';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#52525b';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
    ctx.fill();

    // Draw "VU" label
    ctx.fillStyle = '#e5e5e5';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('VU', centerX, centerY + 25);

    // Draw mounting screws
    const drawScrew = (x: number, y: number) => {
      ctx.fillStyle = '#52525b';
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.strokeStyle = '#3f3f46';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x - 4, y);
      ctx.lineTo(x + 4, y);
      ctx.stroke();
    };

    drawScrew(20, 20);
    drawScrew(width - 20, 20);
    drawScrew(20, height - 20);
    drawScrew(width - 20, height - 20);

  }, [needlePosition]);

  return (
    <Card className="p-4 bg-background">
      <div className="space-y-4">
        {/* Analog VU Meter Display */}
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={400}
            height={240}
            className="w-full h-auto rounded-lg shadow-lg"
            style={{ imageRendering: 'crisp-edges' }}
          />
          
          {/* Indicator Lights */}
          <div className="absolute top-2 right-2 flex gap-2">
            <div className="flex items-center gap-1">
              <div 
                className={`w-3 h-3 rounded-full transition-all ${
                  peakIndicator 
                    ? 'bg-yellow-500 shadow-lg shadow-yellow-500/50' 
                    : 'bg-gray-700'
                }`}
              />
              <span className="text-xs text-muted-foreground">PEAK</span>
            </div>
            <div className="flex items-center gap-1">
              <div 
                className={`w-3 h-3 rounded-full transition-all ${
                  clipIndicator 
                    ? 'bg-red-500 shadow-lg shadow-red-500/50' 
                    : 'bg-gray-700'
                }`}
              />
              <span className="text-xs text-muted-foreground">CLIP</span>
            </div>
          </div>
        </div>

        {/* Calibration Control */}
        {onCalibrationChange && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-xs">Calibration</Label>
              <span className="text-xs text-muted-foreground">{calibration}%</span>
            </div>
            <Slider
              value={[calibration]}
              onValueChange={(v) => onCalibrationChange(v[0])}
              min={10}
              max={150}
              step={5}
              className="w-full"
            />
          </div>
        )}
      </div>
    </Card>
  );
};
