import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, Save, Send, Eye, 
  Type, Image as ImageIcon, MousePointerClick, 
  Code, Video, Timer, FormInput, ShoppingCart,
  Monitor, Smartphone, Clock, Library, Upload, Loader2, Sparkles
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { EmailTemplateLibrary } from "./EmailTemplateLibrary";
import { SubjectLineGenerator } from "./SubjectLineGenerator";
import { ImageGallery } from "./ImageGallery";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface EmailElement {
  id: string;
  type: 'text' | 'image' | 'button' | 'video' | 'countdown' | 'form' | 'shopping';
  content: any;
}

interface EmailDesignerProps {
  onBack: () => void;
  onSave: (design: any) => void;
  onSendOrSchedule: (design: any) => void;
}

export function EmailDesigner({ onBack, onSave, onSendOrSchedule }: EmailDesignerProps) {
  const { toast } = useToast();
  const [campaignName, setCampaignName] = useState("Untitled campaign name");
  const [subjectLine, setSubjectLine] = useState("");
  const [elements, setElements] = useState<EmailElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [autoSave, setAutoSave] = useState(true);
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showSubjectGenerator, setShowSubjectGenerator] = useState(false);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTemplateSelect = (template: any) => {
    setCampaignName(template.name);
    // Parse template body into elements
    const textElement: EmailElement = {
      id: `text-${Date.now()}`,
      type: 'text',
      content: { text: template.body, style: { fontSize: 16, color: '#000000' } }
    };
    setElements([textElement]);
    setShowTemplateLibrary(false);
    toast({
      title: "Template Applied",
      description: `${template.name} template has been loaded.`,
    });
  };

  const handleFileUpload = async (file: File, elementId: string) => {
    try {
      setUploading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('email-assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('email-assets')
        .getPublicUrl(filePath);

      // Get image dimensions if it's an image
      let dimensions = { width: 0, height: 0 };
      if (file.type.startsWith('image/')) {
        const img = new Image();
        dimensions = await new Promise<{ width: number; height: number }>((resolve) => {
          img.onload = () => resolve({ width: img.width, height: img.height });
          img.src = URL.createObjectURL(file);
        });
      }

      // Save metadata to database
      await supabase.from('email_assets').insert({
        user_id: user.id,
        file_name: file.name,
        file_url: publicUrl,
        file_size: file.size,
        file_type: file.type,
        width: dimensions.width || null,
        height: dimensions.height || null,
      });

      // Update the element with the uploaded file URL
      const element = elements.find(el => el.id === elementId);
      if (element?.type === 'image') {
        updateElement(elementId, { url: publicUrl });
      } else if (element?.type === 'video') {
        updateElement(elementId, { url: publicUrl, thumbnail: publicUrl });
      }

      toast({
        title: "File Uploaded",
        description: "Your file has been uploaded successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  // Available elements to drag
  const availableElements = [
    { type: 'text', label: 'Text', icon: Type },
    { type: 'image', label: 'Image', icon: ImageIcon },
    { type: 'button', label: 'Button', icon: MousePointerClick },
    { type: 'video', label: 'Video', icon: Video },
    { type: 'countdown', label: 'Countdown', icon: Timer },
    { type: 'form', label: 'Forms', icon: FormInput },
    { type: 'shopping', label: 'Shopping Cart', icon: ShoppingCart },
  ];

  const addElement = (type: string) => {
    const newElement: EmailElement = {
      id: `${type}-${Date.now()}`,
      type: type as any,
      content: getDefaultContent(type),
    };
    setElements([...elements, newElement]);
    setSelectedElement(newElement.id);
  };

  const getDefaultContent = (type: string) => {
    switch (type) {
      case 'text':
        return { text: 'Add text to your email.', style: { fontSize: 16, color: '#000000' } };
      case 'image':
        return { url: '', alt: '' };
      case 'button':
        return { 
          text: 'Buy now', 
          url: '', 
          style: { 
            backgroundColor: '#2196F3',
            color: '#ffffff',
            fontSize: 16,
            padding: '12px 24px',
            borderRadius: 8
          }
        };
      case 'video':
        return { url: '', thumbnail: '' };
      case 'countdown':
        return { endDate: '', format: 'Days Hours Minutes Seconds' };
      case 'form':
        return { fields: [], submitText: 'Submit' };
      case 'shopping':
        return { items: [] };
      default:
        return {};
    }
  };

  const handleDragStart = (index: number) => {
    dragItem.current = index;
  };

  const handleDragEnter = (index: number) => {
    dragOverItem.current = index;
  };

  const handleDragEnd = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    const newElements = [...elements];
    const draggedItem = newElements[dragItem.current];
    newElements.splice(dragItem.current, 1);
    newElements.splice(dragOverItem.current, 0, draggedItem);
    setElements(newElements);
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const updateElement = (id: string, updates: any) => {
    setElements(elements.map(el => 
      el.id === id ? { ...el, content: { ...el.content, ...updates } } : el
    ));
  };

  const deleteElement = (id: string) => {
    setElements(elements.filter(el => el.id !== id));
    setSelectedElement(null);
  };

  const handleSave = () => {
    onSave({ name: campaignName, elements });
    toast({ title: "Campaign saved", description: "Your email design has been saved." });
  };

  const handleSendOrSchedule = () => {
    onSendOrSchedule({ name: campaignName, elements });
  };

  const renderElementPreview = (element: EmailElement) => {
    const isSelected = selectedElement === element.id;
    const baseClasses = `p-4 mb-2 border-2 rounded transition-colors cursor-pointer ${
      isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
    }`;

    switch (element.type) {
      case 'text':
        return (
          <div 
            className={baseClasses}
            onClick={() => setSelectedElement(element.id)}
          >
            <p style={element.content.style}>{element.content.text}</p>
          </div>
        );
      case 'button':
        return (
          <div 
            className={baseClasses}
            onClick={() => setSelectedElement(element.id)}
          >
            <div className="flex justify-center">
              <button
                style={{
                  ...element.content.style,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {element.content.text}
              </button>
            </div>
          </div>
        );
      case 'image':
        return (
          <div 
            className={baseClasses}
            onClick={() => setSelectedElement(element.id)}
          >
            {element.content.url ? (
              <img src={element.content.url} alt={element.content.alt} className="w-full rounded" />
            ) : (
              <div className="h-40 bg-muted rounded flex items-center justify-center">
                <ImageIcon className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
          </div>
        );
      case 'video':
        return (
          <div 
            className={baseClasses}
            onClick={() => setSelectedElement(element.id)}
          >
            <div className="h-48 bg-muted rounded flex items-center justify-center">
              <Video className="h-16 w-16 text-red-500" />
            </div>
          </div>
        );
      case 'countdown':
        return (
          <div 
            className={baseClasses}
            onClick={() => setSelectedElement(element.id)}
          >
            <div className="text-center font-bold text-4xl">
              00:00:00:00
            </div>
            <div className="flex justify-around text-sm text-muted-foreground mt-2">
              <span>Days</span>
              <span>Hours</span>
              <span>Minutes</span>
              <span>Seconds</span>
            </div>
          </div>
        );
      case 'form':
        return (
          <div 
            className={baseClasses}
            onClick={() => setSelectedElement(element.id)}
          >
            <FormInput className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="text-center mt-2">Form fields will appear here</p>
          </div>
        );
      case 'shopping':
        return (
          <div 
            className={baseClasses}
            onClick={() => setSelectedElement(element.id)}
          >
            <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="text-center mt-2">Shopping cart preview</p>
          </div>
        );
      default:
        return null;
    }
  };

  const renderElementEditor = () => {
    const element = elements.find(el => el.id === selectedElement);
    if (!element) return <div className="p-8 text-center text-muted-foreground">Select an element to edit</div>;

    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold capitalize">{element.type} Settings</h3>
          <Button variant="destructive" size="sm" onClick={() => deleteElement(element.id)}>
            Delete
          </Button>
        </div>

        {element.type === 'text' && (
          <>
            <div>
              <Label>Text Content</Label>
              <Input
                value={element.content.text}
                onChange={(e) => updateElement(element.id, { text: e.target.value })}
                placeholder="Enter text"
              />
            </div>
            <div>
              <Label>Font Size</Label>
              <Input
                type="number"
                value={element.content.style.fontSize}
                onChange={(e) => updateElement(element.id, { 
                  style: { ...element.content.style, fontSize: parseInt(e.target.value) }
                })}
              />
            </div>
            <div>
              <Label>Text Color</Label>
              <Input
                type="color"
                value={element.content.style.color}
                onChange={(e) => updateElement(element.id, { 
                  style: { ...element.content.style, color: e.target.value }
                })}
              />
            </div>
          </>
        )}

        {element.type === 'button' && (
          <>
            <div>
              <Label>Button Text</Label>
              <Input
                value={element.content.text}
                onChange={(e) => updateElement(element.id, { text: e.target.value })}
                placeholder="Buy now"
              />
            </div>
            <div>
              <Label>Link URL</Label>
              <Input
                value={element.content.url}
                onChange={(e) => updateElement(element.id, { url: e.target.value })}
                placeholder="https://example.com"
              />
            </div>
            <div>
              <Label>Background Color</Label>
              <Input
                type="color"
                value={element.content.style.backgroundColor}
                onChange={(e) => updateElement(element.id, { 
                  style: { ...element.content.style, backgroundColor: e.target.value }
                })}
              />
            </div>
            <div>
              <Label>Text Color</Label>
              <Input
                type="color"
                value={element.content.style.color}
                onChange={(e) => updateElement(element.id, { 
                  style: { ...element.content.style, color: e.target.value }
                })}
              />
            </div>
            <div>
              <Label>Border Radius</Label>
              <Input
                type="number"
                value={element.content.style.borderRadius}
                onChange={(e) => updateElement(element.id, { 
                  style: { ...element.content.style, borderRadius: parseInt(e.target.value) }
                })}
              />
            </div>
          </>
        )}

        {element.type === 'image' && (
          <>
            <div>
              <Label>Upload Image</Label>
              <div className="space-y-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, element.id);
                  }}
                  disabled={uploading}
                  className="cursor-pointer"
                />
                {uploading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading...
                  </div>
                )}
              </div>
            </div>
            <div>
              <Label>Or Enter Image URL</Label>
              <Input
                value={element.content.url}
                onChange={(e) => updateElement(element.id, { url: e.target.value })}
                placeholder="https://example.com/image.jpg"
                disabled={uploading}
              />
            </div>
            {element.content.url && (
              <div className="mt-2">
                <img src={element.content.url} alt="Preview" className="w-full rounded border" />
              </div>
            )}
            <div>
              <Label>Alt Text</Label>
              <Input
                value={element.content.alt}
                onChange={(e) => updateElement(element.id, { alt: e.target.value })}
                placeholder="Image description"
                disabled={uploading}
              />
            </div>
          </>
        )}

        {element.type === 'video' && (
          <>
            <div>
              <Label>Upload Video</Label>
              <div className="space-y-2">
                <Input
                  type="file"
                  accept="video/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, element.id);
                  }}
                  disabled={uploading}
                  className="cursor-pointer"
                />
                {uploading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading...
                  </div>
                )}
              </div>
            </div>
            <div>
              <Label>Or Enter Video URL</Label>
              <Input
                value={element.content.url}
                onChange={(e) => updateElement(element.id, { url: e.target.value })}
                placeholder="https://youtube.com/..."
                disabled={uploading}
              />
            </div>
            {element.content.url && (
              <div className="mt-2 p-2 bg-muted rounded text-sm">
                Video URL: {element.content.url}
              </div>
            )}
          </>
        )}

        {element.type === 'countdown' && (
          <>
            <div>
              <Label>End Date</Label>
              <Input
                type="datetime-local"
                value={element.content.endDate}
                onChange={(e) => updateElement(element.id, { endDate: e.target.value })}
              />
            </div>
          </>
        )}
      </div>
    );
  };

  if (showTemplateLibrary) {
    return (
      <div className="flex flex-col h-screen bg-background">
        <div className="border-b bg-card px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Library className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Choose a Template</h2>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-6">
          <EmailTemplateLibrary onSelectTemplate={handleTemplateSelect} />
          <div className="mt-6 pt-6 border-t">
            <Button 
              variant="outline" 
              onClick={() => setShowTemplateLibrary(false)}
              className="w-full"
            >
              Start from Scratch
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Bar */}
      <div className="border-b px-4 py-3 flex items-center justify-between bg-card">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            {autoSave ? "Autosave on" : "Not Saved"}
          </div>
        </div>

        <Input
          value={campaignName}
          onChange={(e) => setCampaignName(e.target.value)}
          className="max-w-md text-center font-semibold"
        />

        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowTemplateLibrary(true)}
          >
            <Library className="h-4 w-4 mr-2" />
            Templates
          </Button>
          <Button variant="outline" size="sm" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          <Button size="sm" onClick={handleSendOrSchedule}>
            <Send className="h-4 w-4 mr-2" />
            Send or Schedule
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Elements & Gallery */}
        <div className="w-80 border-r bg-card flex flex-col">
          <Tabs defaultValue="elements" className="flex-1 flex flex-col h-full">
            <TabsList className="w-full grid grid-cols-2 m-2">
              <TabsTrigger value="elements">Elements</TabsTrigger>
              <TabsTrigger value="gallery">Gallery</TabsTrigger>
            </TabsList>
            
            <TabsContent value="elements" className="flex-1 p-4 overflow-y-auto">
              {/* Subject Line with AI Generator */}
              <div className="mb-6 pb-4 border-b space-y-2">
                <Label htmlFor="subject-line" className="text-xs">Subject Line</Label>
                <div className="flex gap-2">
                  <Input
                    id="subject-line"
                    value={subjectLine}
                    onChange={(e) => setSubjectLine(e.target.value)}
                    placeholder="Enter subject line..."
                    className="text-sm"
                  />
                  <Dialog open={showSubjectGenerator} onOpenChange={setShowSubjectGenerator}>
                    <DialogTrigger asChild>
                      <Button size="icon" variant="outline" className="shrink-0">
                        <Sparkles className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-primary" />
                          AI Subject Line Generator
                        </DialogTitle>
                        <DialogDescription>
                          Get AI-powered subject line suggestions optimized for different personality types and past campaign performance.
                        </DialogDescription>
                      </DialogHeader>
                      <SubjectLineGenerator 
                        onSelect={(subject) => {
                          setSubjectLine(subject);
                          setShowSubjectGenerator(false);
                          toast({
                            title: "Subject Line Updated",
                            description: "AI-generated subject line has been applied",
                          });
                        }}
                        currentSubject={subjectLine}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
                {subjectLine && (
                  <p className="text-xs text-muted-foreground">
                    {subjectLine.length} characters
                  </p>
                )}
              </div>

              <h3 className="font-semibold mb-3 text-sm">Add Elements</h3>
              <div className="space-y-2">
                {availableElements.map(({ type, label, icon: Icon }) => (
                  <button
                    key={type}
                    onClick={() => addElement(type)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent hover:border-primary transition-colors"
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-sm font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="gallery" className="flex-1 m-0 p-0 overflow-hidden">
              <ImageGallery 
                onSelectImage={(url, name) => {
                  const imageElement: EmailElement = {
                    id: `image-${Date.now()}`,
                    type: 'image',
                    content: { url, alt: name }
                  };
                  setElements([...elements, imageElement]);
                  toast({
                    title: "Image Added",
                    description: "Image has been added to your email.",
                  });
                }}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Center - Preview */}
        <div className="flex-1 bg-muted/20 overflow-y-auto p-8">
          <div className="mb-4 flex justify-center gap-2">
            <Button
              variant={previewDevice === 'desktop' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPreviewDevice('desktop')}
            >
              <Monitor className="h-4 w-4 mr-2" />
              Desktop
            </Button>
            <Button
              variant={previewDevice === 'mobile' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPreviewDevice('mobile')}
            >
              <Smartphone className="h-4 w-4 mr-2" />
              Mobile
            </Button>
          </div>

          <div className={`mx-auto bg-white shadow-xl rounded-lg overflow-hidden ${
            previewDevice === 'mobile' ? 'max-w-sm' : 'max-w-2xl'
          }`}>
            {/* Email Header */}
            <div className="bg-gradient-to-r from-primary to-primary/80 p-6 text-white text-center">
              <h1 className="text-2xl font-bold">Start from scratch</h1>
              <p className="text-sm opacity-90 mt-1">View this email in browser</p>
            </div>

            {/* Email Body */}
            <div className="p-6">
              {elements.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p className="text-lg">Add elements from the left sidebar to start building your email</p>
                </div>
              ) : (
                elements.map((element, index) => (
                  <div
                    key={element.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragEnter={() => handleDragEnter(index)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    {renderElementPreview(element)}
                  </div>
                ))
              )}
            </div>

            {/* Email Footer */}
            <div className="bg-muted p-6 text-center text-sm text-muted-foreground">
              <p>© {new Date().getFullYear()} Your Brand. All rights reserved.</p>
              <p className="mt-2">
                <a href="#" className="underline">Unsubscribe</a> | <a href="#" className="underline">Preferences</a>
              </p>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Element Editor */}
        <div className="w-80 border-l bg-card overflow-y-auto">
          {renderElementEditor()}
        </div>
      </div>
    </div>
  );
}
