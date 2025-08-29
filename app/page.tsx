"use client";

import { Button } from "@/components/ui/button";
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadItem,
  FileUploadItemDelete,
  FileUploadItemMetadata,
  FileUploadItemPreview,
  FileUploadList,
  FileUploadTrigger,
} from "@/components/ui/file-upload";
import { Send, Upload, X } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

export default function Home() {
  const [files, setFiles] = React.useState<File[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  const onFileReject = React.useCallback((file: File, message: string) => {
    toast(message, {
      description: `"${
        file.name.length > 20 ? `${file.name.slice(0, 20)}...` : file.name
      }" has been rejected`,
    });
  }, []);

  const handleSendFile = async () => {
    if (files.length === 0) {
      toast.error("Nenhum arquivo selecionado");
      return;
    }

    const file = files[0]; // Pega o primeiro arquivo
    setIsLoading(true);

    try {
      const response = await fetch(
        "https://n8n-main.dfg6yw.easypanel.host/webhook-test/pedidos",
        {
          method: "POST",
          headers: {
            "Content-Type": "text/csv",
          },
          body: file,
        }
      );

      if (response.ok) {
        toast.success("Arquivo enviado com sucesso!", {
          description: `"${file.name}" foi enviado para o webhook`,
        });
        // Limpa os arquivos após envio bem-sucedido
        setFiles([]);
      } else {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Erro ao enviar arquivo:", error);
      toast.error("Erro ao enviar arquivo", {
        description:
          error instanceof Error ? error.message : "Tente novamente mais tarde",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-dvh flex justify-center items-center">
      <div className="w-full max-w-md space-y-4">
        <FileUpload
          maxFiles={2}
          maxSize={5 * 1024 * 1024}
          className="w-full"
          value={files}
          onValueChange={setFiles}
          onFileReject={onFileReject}
          multiple
        >
          <FileUploadDropzone>
            <div className="flex flex-col items-center gap-1 text-center">
              <div className="flex items-center justify-center rounded-full border p-2.5">
                <Upload className="size-6 text-muted-foreground" />
              </div>
              <p className="font-medium text-sm">
                Arraste e solte os arquivos aqui
              </p>
              <p className="text-muted-foreground text-xs">
                Ou clique para procurar (máx. 2 arquivos, até 5MB cada)
              </p>
            </div>
            <FileUploadTrigger asChild>
              <Button variant="outline" size="sm" className="mt-2 w-fit">
                Procurar arquivos
              </Button>
            </FileUploadTrigger>
          </FileUploadDropzone>
          <FileUploadList>
            {files.map((file, index) => (
              <FileUploadItem key={index} value={file}>
                <FileUploadItemPreview />
                <FileUploadItemMetadata />
                <FileUploadItemDelete asChild>
                  <Button variant="ghost" size="icon" className="size-7">
                    <X />
                  </Button>
                </FileUploadItemDelete>
              </FileUploadItem>
            ))}
          </FileUploadList>
        </FileUpload>

        {/* Botão para enviar o arquivo */}
        {files.length > 0 && (
          <Button
            onClick={handleSendFile}
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Enviar CSV para Webhook
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
