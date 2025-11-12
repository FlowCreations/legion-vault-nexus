import React, { useEffect, useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Signal, Clock, Wifi, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Room } from 'livekit-client';

interface AudioDiagnosticsProps {
  audioContext: AudioContext | null;
  rawAudioAnalyser?: AnalyserNode | null;
  processedAudioAnalyser?: AnalyserNode | null;
  room?: Room | null;
  status?: string;
}

export function AudioDiagnostics({ 
  audioContext, 
  rawAudioAnalyser, 
  processedAudioAnalyser,
  room,
  status 
}: AudioDiagnosticsProps) {
  // Audio signal metrics
  const [rawSignalLevel, setRawSignalLevel] = useState(0);
  const [processedSignalLevel, setProcessedSignalLevel] = useState(0);
  const [signalQuality, setSignalQuality] = useState<'excellent' | 'good' | 'poor' | 'none'>('none');
  
  // Latency metrics
  const [audioLatency, setAudioLatency] = useState(0);
  const [processingLatency, setProcessingLatency] = useState(0);
  
  // Connection metrics
  const [connectionState, setConnectionState] = useState<string>('disconnected');
  const [bitrate, setBitrate] = useState(0);
  const [packetLoss, setPacketLoss] = useState(0);
  const [jitter, setJitter] = useState(0);
  
  const animationFrameRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(Date.now());

  // Monitor raw and processed audio signals
  useEffect(() => {
    if (!rawAudioAnalyser && !processedAudioAnalyser) return;

    const rawDataArray = rawAudioAnalyser ? new Uint8Array(rawAudioAnalyser.frequencyBinCount) : null;
    const processedDataArray = processedAudioAnalyser ? new Uint8Array(processedAudioAnalyser.frequencyBinCount) : null;

    const updateMetrics = () => {
      const now = Date.now();
      const deltaTime = now - lastUpdateRef.current;
      
      // Calculate raw signal level
      if (rawAudioAnalyser && rawDataArray) {
        // Use frequency data instead for better signal detection
        rawAudioAnalyser.getByteFrequencyData(rawDataArray);
        
        // Calculate RMS from frequency data
        let sum = 0;
        for (let i = 0; i < rawDataArray.length; i++) {
          sum += rawDataArray[i] * rawDataArray[i];
        }
        const rms = Math.sqrt(sum / rawDataArray.length);
        
        // Convert to dB (0-255 range to dB)
        const dbLevel = 20 * Math.log10((rms / 255) + 0.0001);
        setRawSignalLevel(Math.max(-60, Math.min(0, dbLevel)));
        
        // Debug logging
        if (rms > 5) {
          console.log('[AudioDiagnostics] Raw signal detected:', { rms, dbLevel: dbLevel.toFixed(1) });
        }
      }
      
      // Calculate processed signal level
      if (processedAudioAnalyser && processedDataArray) {
        // Use frequency data for better signal detection
        processedAudioAnalyser.getByteFrequencyData(processedDataArray);
        
        // Calculate RMS from frequency data
        let sum = 0;
        for (let i = 0; i < processedDataArray.length; i++) {
          sum += processedDataArray[i] * processedDataArray[i];
        }
        const rms = Math.sqrt(sum / processedDataArray.length);
        
        // Convert to dB (0-255 range to dB)
        const dbLevel = 20 * Math.log10((rms / 255) + 0.0001);
        setProcessedSignalLevel(Math.max(-60, Math.min(0, dbLevel)));
        
        // Determine signal quality based on processed level
        if (dbLevel > -12) {
          setSignalQuality('excellent');
        } else if (dbLevel > -24) {
          setSignalQuality('good');
        } else if (dbLevel > -40) {
          setSignalQuality('poor');
        } else {
          setSignalQuality('none');
        }
        
        // Debug logging
        if (rms > 5) {
          console.log('[AudioDiagnostics] Processed signal detected:', { rms, dbLevel: dbLevel.toFixed(1) });
        }
      }
      
      // Calculate processing latency (difference in timing)
      if (audioContext) {
        const baseLatency = audioContext.baseLatency * 1000; // Convert to ms
        const outputLatency = audioContext.outputLatency * 1000;
        setAudioLatency(Math.round(baseLatency + outputLatency));
        
        // Estimate processing latency from buffer size
        const bufferLatency = (256 / audioContext.sampleRate) * 1000;
        setProcessingLatency(Math.round(bufferLatency));
      }
      
      lastUpdateRef.current = now;
      animationFrameRef.current = requestAnimationFrame(updateMetrics);
    };

    updateMetrics();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [rawAudioAnalyser, processedAudioAnalyser, audioContext]);

  // Monitor LiveKit connection quality
  useEffect(() => {
    if (!room) {
      setConnectionState('disconnected');
      return;
    }

    const updateConnectionMetrics = async () => {
      try {
        const state = room.state;
        setConnectionState(state);
        
        // Get audio track stats if available
        const localParticipant = room.localParticipant;
        const audioTracks = Array.from(localParticipant.audioTrackPublications.values());
        
        if (audioTracks.length > 0) {
          const audioTrack = audioTracks[0];
          if (audioTrack.track) {
            // Get WebRTC stats
            const stats = await audioTrack.track.getRTCStatsReport();
            
            stats?.forEach((stat: any) => {
              if (stat.type === 'outbound-rtp') {
                // Calculate bitrate
                if (stat.bytesSent !== undefined) {
                  setBitrate(Math.round((stat.bytesSent * 8) / 1000)); // kbps
                }
                
                // Get packet loss
                if (stat.packetsLost !== undefined && stat.packetsSent !== undefined) {
                  const loss = (stat.packetsLost / (stat.packetsSent + stat.packetsLost)) * 100;
                  setPacketLoss(Math.round(loss * 100) / 100);
                }
              }
              
              if (stat.type === 'remote-inbound-rtp') {
                // Get jitter
                if (stat.jitter !== undefined) {
                  setJitter(Math.round(stat.jitter * 1000)); // Convert to ms
                }
              }
            });
          }
        }
      } catch (error) {
        console.error('[AudioDiagnostics] Error updating connection metrics:', error);
      }
    };

    // Update every 1 second
    const interval = setInterval(updateConnectionMetrics, 1000);
    updateConnectionMetrics();

    return () => clearInterval(interval);
  }, [room]);

  const getSignalColor = (level: number) => {
    if (level > -12) return 'text-green-500';
    if (level > -24) return 'text-yellow-500';
    if (level > -40) return 'text-orange-500';
    return 'text-red-500';
  };

  const getQualityBadge = () => {
    switch (signalQuality) {
      case 'excellent':
        return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" />Excellent</Badge>;
      case 'good':
        return <Badge className="bg-blue-500"><CheckCircle2 className="w-3 h-3 mr-1" />Good</Badge>;
      case 'poor':
        return <Badge className="bg-yellow-500"><Signal className="w-3 h-3 mr-1" />Detecting</Badge>;
      default:
        // Changed from "No Signal" to "Monitoring" to avoid false negatives
        return <Badge variant="outline"><Signal className="w-3 h-3 mr-1" />Monitoring</Badge>;
    }
  };

  const getConnectionBadge = () => {
    if (connectionState === 'connected') {
      return <Badge className="bg-green-500"><Wifi className="w-3 h-3 mr-1" />Connected</Badge>;
    } else if (connectionState === 'connecting') {
      return <Badge className="bg-yellow-500"><Wifi className="w-3 h-3 mr-1" />Connecting</Badge>;
    } else {
      return <Badge variant="outline"><Wifi className="w-3 h-3 mr-1" />Offline</Badge>;
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-sm">Audio Diagnostics</h3>
      </div>

      <div className="space-y-4">
        {/* Signal Strength */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Signal className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-medium">Signal Strength</span>
            </div>
            {getQualityBadge()}
          </div>
          
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Raw Input</span>
                <span className={`font-mono font-semibold ${getSignalColor(rawSignalLevel)}`}>
                  {rawSignalLevel.toFixed(1)} dB
                </span>
              </div>
              {/* Visual level meter */}
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-100 ${
                    rawSignalLevel > -12 ? 'bg-green-500' :
                    rawSignalLevel > -24 ? 'bg-yellow-500' :
                    rawSignalLevel > -40 ? 'bg-orange-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.max(0, ((rawSignalLevel + 60) / 60) * 100)}%` }}
                />
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Processed</span>
                <span className={`font-mono font-semibold ${getSignalColor(processedSignalLevel)}`}>
                  {processedSignalLevel.toFixed(1)} dB
                </span>
              </div>
              {/* Visual level meter */}
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-100 ${
                    processedSignalLevel > -12 ? 'bg-green-500' :
                    processedSignalLevel > -24 ? 'bg-yellow-500' :
                    processedSignalLevel > -40 ? 'bg-orange-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.max(0, ((processedSignalLevel + 60) / 60) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Latency Metrics */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium">Latency</span>
          </div>
          
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Audio</span>
              <span className="font-mono font-semibold">{audioLatency} ms</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Processing</span>
              <span className="font-mono font-semibold">{processingLatency} ms</span>
            </div>
          </div>
          
          {(audioLatency + processingLatency) > 100 && (
            <div className="mt-2 text-xs text-yellow-600 dark:text-yellow-500 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              <span>High latency detected</span>
            </div>
          )}
        </div>

        {status === 'live' && (
          <>
            <Separator />

            {/* Connection Quality */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs font-medium">Connection</span>
                </div>
                {getConnectionBadge()}
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bitrate</span>
                  <span className="font-mono font-semibold">{bitrate} kbps</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Packet Loss</span>
                  <span className={`font-mono font-semibold ${packetLoss > 2 ? 'text-red-500' : ''}`}>
                    {packetLoss}%
                  </span>
                </div>
                
                <div className="flex justify-between col-span-2">
                  <span className="text-muted-foreground">Jitter</span>
                  <span className="font-mono font-semibold">{jitter} ms</span>
                </div>
              </div>
              
              {packetLoss > 2 && (
                <div className="mt-2 text-xs text-red-600 dark:text-red-500 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Poor connection quality - packet loss detected</span>
                </div>
              )}
            </div>
          </>
        )}

        {/* Audio Context Info */}
        {audioContext && (
          <>
            <Separator />
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex justify-between">
                <span>Sample Rate</span>
                <span className="font-mono">{audioContext.sampleRate} Hz</span>
              </div>
              <div className="flex justify-between">
                <span>Context State</span>
                <span className="font-mono capitalize">{audioContext.state}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
