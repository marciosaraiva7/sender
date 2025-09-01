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
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowUpDown, Send, Upload, X } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

export default function Home() {
  const [files, setFiles] = React.useState<File[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [headers, setHeaders] = React.useState<string[]>([]);
  const [rows, setRows] = React.useState<Record<string, string>[]>([]);
  const [sortKey, setSortKey] = React.useState<string | null>(null);
  const [sortAsc, setSortAsc] = React.useState(true);
  const [query, setQuery] = React.useState("");

  function parseCSV(text: string): { headers: string[]; rows: string[][] } {
    const result: string[][] = [];
    let cur: string[] = [];
    let field = "";
    let inQuotes = false;
    const pushField = () => {
      cur.push(field);
      field = "";
    };
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      const next = text[i + 1];
      if (inQuotes) {
        if (c === '"' && next === '"') {
          field += '"';
          i++; // skip escaped quote
        } else if (c === '"') {
          inQuotes = false;
        } else {
          field += c;
        }
      } else {
        if (c === '"') {
          inQuotes = true;
        } else if (c === ",") {
          pushField();
        } else if (c === "\n") {
          pushField();
          result.push(cur);
          cur = [];
        } else if (c === "\r") {
          // ignore CR; handle CRLF
          continue;
        } else {
          field += c;
        }
      }
    }
    // flush last field/row
    pushField();
    if (cur.length > 1 || (cur.length === 1 && cur[0] !== "")) {
      result.push(cur);
    }

    if (result.length === 0) return { headers: [], rows: [] };
    const [h, ...r] = result;
    return { headers: h, rows: r };
  }

  const buildTable = React.useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const { headers, rows } = parseCSV(text);
      setHeaders(headers);
      const objects = rows.map((r) => {
        const obj: Record<string, string> = {};
        headers.forEach((h, idx) => {
          obj[h] = r[idx] ?? "";
        });
        return obj;
      });
      setRows(objects);
      setSortKey(null);
      setQuery("");
    } catch (e) {
      console.error(e);
      toast.error("Falha ao ler o CSV");
    }
  }, []);

  const onFileReject = React.useCallback((file: File, message: string) => {
    toast(message, {
      description: `"${
        file.name.length > 20 ? `${file.name.slice(0, 20)}...` : file.name
      }" has been rejected`,
    });
  }, []);

  React.useEffect(() => {
    // When selecting files, immediately parse the first CSV
    if (files && files.length > 0) {
      const first = files[0];
      // Only attempt to parse CSV-like files
      const isCsv =
        first.type === "text/csv" ||
        first.name.toLowerCase().endsWith(".csv") ||
        first.name.toLowerCase().includes("teste-pedido-x");
      if (isCsv) {
        buildTable(first);
      }
    } else {
      setHeaders([]);
      setRows([]);
      setSortKey(null);
      setQuery("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files]);

  const handleSendFile = async () => {
    if (files.length === 0) {
      toast.error("Nenhum arquivo selecionado");
      return;
    }

    const file = files[0]; // Pega o primeiro arquivo
    setIsLoading(true);

    try {
      const response = await fetch(
        "https://n8n-main.dfg6yw.easypanel.host/webhook/pedidos",
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
        setHeaders([]);
        setRows([]);
        setSortKey(null);
        setQuery("");
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
    <div className="w-full h-dvh flex justify-center items-start py-8">
      <div className="w-full max-w-5xl space-y-6 px-4">
        <FileUpload
          accept=".csv,text/csv"
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
            className="w-full max-w-md bg-green-600 hover:bg-green-700"
            size="lg"
          >
            {isLoading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent " />
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

        {/* Tabela gerada a partir do CSV */}
        {headers.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-semibold">Pré-visualização do CSV</h2>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filtrar..."
                className="border bg-background px-3 py-2 rounded-md text-sm w-56"
              />
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  {headers.map((h) => (
                    <TableHead
                      key={h}
                      className="cursor-pointer select-none"
                      onClick={() => {
                        if (sortKey === h) {
                          setSortAsc(!sortAsc);
                        } else {
                          setSortKey(h);
                          setSortAsc(true);
                        }
                      }}
                    >
                      <div className="inline-flex items-center gap-1">
                        <span>{h}</span>
                        <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows
                  .filter((r) =>
                    query
                      ? Object.values(r).some((v) =>
                          String(v).toLowerCase().includes(query.toLowerCase())
                        )
                      : true
                  )
                  .sort((a, b) => {
                    if (!sortKey) return 0;
                    const av = a[sortKey] ?? "";
                    const bv = b[sortKey] ?? "";
                    return sortAsc
                      ? String(av).localeCompare(String(bv))
                      : String(bv).localeCompare(String(av));
                  })
                  .map((r, idx) => (
                    <TableRow key={idx}>
                      {headers.map((h) => (
                        <TableCell key={h}>{r[h] ?? ""}</TableCell>
                      ))}
                    </TableRow>
                  ))}
              </TableBody>
              <TableCaption>
                {rows.length} linha(s) • Clique no cabeçalho para ordenar
              </TableCaption>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
