import ChatInterface from "./components/ChatInterface";
import { Toaster } from "@/components/ui/sonner";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <ChatInterface />
      <Toaster position="top-center" richColors />
    </div>
  );
}
