export function downloadImage(imageUrl: string, filename?: string) {
  const link = document.createElement('a');
  link.href = imageUrl;
  link.download = filename || `evidence-photo-${Date.now()}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function downloadAudio(audioUrl: string, filename?: string) {
  const link = document.createElement('a');
  link.href = audioUrl;
  link.download = filename || `voice-recording-${Date.now()}.webm`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
