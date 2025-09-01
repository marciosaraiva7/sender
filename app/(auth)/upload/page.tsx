"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadItem,
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
import { ArrowUpDown, Send, Trash2, Upload } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

export default function Home() {
  const [files, setFiles] = React.useState<File[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [headers, setHeaders] = React.useState<string[]>([]);
  const [rows, setRows] = React.useState<
    { id: string; cells: Record<string, string> }[]
  >([]);
  const [sortKey, setSortKey] = React.useState<string | null>(null);
  const [sortAsc, setSortAsc] = React.useState(true);
  const [query, setQuery] = React.useState("");
  const [rowSelected, setRowSelected] = React.useState<Set<string>>(new Set());
  const [dirty, setDirty] = React.useState(false);
  const [selectedAffiliate, setSelectedAffiliate] =
    React.useState<string>("__all__");

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

  const uid = React.useCallback(() => {
    try {
      if (
        typeof window !== "undefined" &&
        typeof window.crypto?.randomUUID === "function"
      ) {
        return window.crypto.randomUUID();
      }
    } catch {}
    return Math.random().toString(36).slice(2);
  }, []);

  const buildTable = React.useCallback(
    async (file: File) => {
      try {
        const text = await file.text();
        const { headers, rows } = parseCSV(text);
        setHeaders(headers);
        const objects = rows.map((r) => {
          const obj: Record<string, string> = {};
          headers.forEach((h, idx) => {
            obj[h] = r[idx] ?? "";
          });
          return { id: uid(), cells: obj };
        });
        setRows(objects);
        setSortKey(null);
        setQuery("");
        setRowSelected(new Set());
        setDirty(false);
        setSelectedAffiliate("__all__");
      } catch (e) {
        console.error(e);
        toast.error("Falha ao ler o CSV", {
          richColors: true,
          position: "top-center",
        });
      }
    },
    [uid]
  );

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
      setRowSelected(new Set());
      setDirty(false);
      setSelectedAffiliate("__all__");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files]);

  const handleSendFile = async () => {
    if (files.length === 0) {
      toast.error("Nenhum arquivo selecionado", {
        richColors: true,
        position: "top-center",
      });
      return;
    }

    let file = files[0]; // Pega o primeiro arquivo
    setIsLoading(true);

    try {
      // Se houver alterações pendentes na tabela, use-as no envio
      if (dirty) {
        const csv = toCSV(headers, rows);
        file = new File([csv], file.name, { type: "text/csv" });
      }
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
          richColors: true,
          position: "top-center",
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

  const allRowsSelected =
    rows.length > 0 && rows.every((r) => rowSelected.has(r.id));
  const toggleSelectAllRows = () => {
    if (allRowsSelected) setRowSelected(new Set());
    else setRowSelected(new Set(rows.map((r) => r.id)));
  };

  // Sem edição inline no momento; manter utilitários mínimos para remoção e persistência

  const deleteRows = (ids: Set<string>) => {
    if (ids.size === 0) return;
    setRows((prev) => prev.filter((r) => !ids.has(r.id)));
    setRowSelected(new Set());
    setDirty(true);
  };

  const escapeCsv = (val: string) => {
    const needsQuotes = /[",\n\r]/.test(val);
    const out = val.replace(/"/g, '""');
    return needsQuotes ? `"${out}"` : out;
  };

  const toCSV = (
    headers: string[],
    data: { cells: Record<string, string> }[]
  ) => {
    const headerLine = headers.map(escapeCsv).join(",");
    const lines = data.map((r) =>
      headers.map((h) => escapeCsv(r.cells[h] ?? "")).join(",")
    );
    return [headerLine, ...lines].join("\r\n");
  };

  const applyChangesToFile = async () => {
    if (!files.length) {
      toast.error("Nenhum arquivo para atualizar", {
        richColors: true,
        position: "top-center",
      });
      return;
    }
    const csv = toCSV(headers, rows);
    const prev = files[0];
    const updated = new File([csv], prev.name, { type: "text/csv" });
    setFiles([updated]);
    setDirty(false);
    toast.success("Arquivo atualizado com as alterações da tabela", {
      richColors: true,
      position: "top-center",
    });
  };

  // Colunas ocultas visualmente na tabela
  const normalizeKey = React.useCallback(
    (s: string) =>
      s
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .replace(/[_\s-]+/g, "")
        .trim(),
    []
  );

  const isHiddenColumn = React.useCallback(
    (h: string) => {
      const key = normalizeKey(h);
      return (
        key === "bilhetes" ||
        key === "upsell" ||
        key === "referenciaexternadopagamento" ||
        key === "datadenascimento"
      );
    },
    [normalizeKey]
  );

  const displayHeaders = React.useMemo(
    () => headers.filter((h) => !isHiddenColumn(h)),
    [headers, isHiddenColumn]
  );

  // Helpers para dashboard de afiliados
  const parseBRLToNumber = (val: string): number => {
    if (!val) return 0;
    const cleaned = val
      .replace(/\s/g, "")
      .replace(/R\$?/gi, "")
      .replace(/\./g, "")
      .replace(/,/g, ".");
    const n = parseFloat(cleaned);
    return Number.isFinite(n) ? n : 0;
  };

  const currency = (n: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(n);

  const affiliateFieldKey = React.useMemo(() => {
    const norm = (s: string) => s.toLowerCase();
    const candidates = ["afiliado", "afiliados", "afiliado(a)"];
    const found = headers.find((h) => candidates.includes(norm(h)));
    return found ?? "Afiliado";
  }, [headers]);

  const valorFieldKey = React.useMemo(() => {
    const norm = (s: string) => s.toLowerCase();
    const candidates = ["valor", "total", "montante"];
    const found = headers.find((h) => candidates.includes(norm(h)));
    return found ?? "Valor";
  }, [headers]);

  const affiliateOptions = React.useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => {
      const a = (r.cells[affiliateFieldKey] || "").trim();
      if (a) set.add(a);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [rows, affiliateFieldKey]);

  const totalBySelection = React.useMemo(() => {
    const filtered = rows.filter((r) => {
      const a = (r.cells[affiliateFieldKey] || "").trim();
      return selectedAffiliate === "__all__" ? true : a === selectedAffiliate;
    });
    const total = filtered.reduce(
      (sum, r) => sum + parseBRLToNumber(r.cells[valorFieldKey] || "0"),
      0
    );
    return { total, count: filtered.length };
  }, [rows, affiliateFieldKey, valorFieldKey, selectedAffiliate]);

  return (
    <div className="w-full h-dvh flex justify-center items-start py-8">
      <div className="w-full max-w-5xl space-y-6 px-4">
        <FileUpload
          accept=".csv,text/csv"
          maxFiles={1}
          maxSize={5 * 1024 * 1024}
          className="w-full"
          value={files}
          onValueChange={(next) =>
            setFiles(next.length ? [next[next.length - 1]] : [])
          }
          onFileReject={onFileReject}
          multiple={false}
        >
          {files.length === 0 ? (
            <FileUploadDropzone>
              <div className="flex flex-col items-center gap-1 text-center">
                <div className="flex items-center justify-center rounded-full border p-2.5">
                  <Upload className="size-6 text-muted-foreground" />
                </div>
                <p className="font-medium text-sm">
                  Arraste e solte o arquivo aqui
                </p>
                <p className="text-muted-foreground text-xs">
                  Ou clique para procurar (apenas 1 arquivo, até 5MB)
                </p>
              </div>
              <FileUploadTrigger asChild>
                <Button variant="outline" size="sm" className="mt-2 w-fit">
                  Procurar arquivo
                </Button>
              </FileUploadTrigger>
            </FileUploadDropzone>
          ) : (
            <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
              <div className="flex items-center gap-3 min-w-0">
                <FileUploadList>
                  {files.slice(0, 1).map((file, index) => (
                    <FileUploadItem key={index} value={file}>
                      <FileUploadItemPreview />
                      <FileUploadItemMetadata />
                    </FileUploadItem>
                  ))}
                </FileUploadList>
              </div>
              <FileUploadTrigger asChild>
                <Button
                  variant="outline"
                  onClick={() => {
                    // Limpa o arquivo atual para permitir substituir sem rejeição de maxFiles
                    setFiles([]);
                  }}
                >
                  Trocar arquivo
                </Button>
              </FileUploadTrigger>
            </div>
          )}
        </FileUpload>

        {/* Botão flutuante principal para enviar o arquivo */}
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={handleSendFile}
            disabled={
              isLoading || files.length === 0 || rowSelected.size > 0 || dirty
            }
            size="lg"
            className="shadow-xl bg-green-600 hover:bg-green-700"
          >
            {isLoading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="mr-2 h-5 w-5" />
                Fazer disparo em massa
              </>
            )}
          </Button>
        </div>

        {/* Tabela gerada a partir do CSV */}
        {headers.length > 0 && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="font-semibold">Pré-visualização do CSV</h2>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filtrar..."
                className="border bg-background px-3 py-2 rounded-md text-sm w-full sm:w-56"
              />
            </div>
            {/* Dashboard de afiliados */}
            <div className="rounded-lg border p-4 bg-background">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
                <label className="text-sm flex flex-col gap-1">
                  <span className="text-muted-foreground">Afiliado</span>
                  <select
                    className="border rounded-md bg-background px-3 py-2 text-sm w-full sm:min-w-56"
                    value={selectedAffiliate}
                    onChange={(e) => setSelectedAffiliate(e.target.value)}
                  >
                    <option value="__all__">Todos</option>
                    {affiliateOptions.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="ml-auto text-sm">
                  <div className="text-muted-foreground">Total selecionado</div>
                  <div className="text-2xl font-semibold">
                    {currency(totalBySelection.total)}
                  </div>
                  <div className="text-muted-foreground">
                    {totalBySelection.count} pedido(s)
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={rowSelected.size === 0}
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" /> Remover linhas (
                    {rowSelected.size})
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Remover linhas selecionadas?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação irá excluir {rowSelected.size} linha(s) da
                      tabela.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteRows(rowSelected)}>
                      Remover
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button
                onClick={applyChangesToFile}
                disabled={!rows.length}
                className="ml-auto w-full sm:w-auto"
              >
                {dirty ? "Salvar alterações no arquivo" : "Regravar arquivo"}
              </Button>
            </div>

            <div className="rounded-lg border overflow-x-auto overflow-y-auto max-h-[70vh]">
              <Table className="text-[13px] sm:text-sm table-fixed min-w-[640px] sm:min-w-[900px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8 sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                      <Checkbox
                        checked={allRowsSelected}
                        onCheckedChange={toggleSelectAllRows}
                      />
                    </TableHead>
                    {displayHeaders.map((h) => (
                      <TableHead
                        key={h}
                        className="cursor-pointer select-none h-12 px-3 text-xs sm:text-[13px] uppercase tracking-wide sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
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
                    <TableHead className="w-16 sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                      Ações
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows
                    .filter((r) => {
                      const aff = (r.cells[affiliateFieldKey] || "").trim();
                      const affiliateMatch =
                        selectedAffiliate === "__all__" ||
                        aff === selectedAffiliate;
                      const queryMatch = query
                        ? Object.values(r.cells).some((v) =>
                            String(v)
                              .toLowerCase()
                              .includes(query.toLowerCase())
                          )
                        : true;
                      return affiliateMatch && queryMatch;
                    })
                    .sort((a, b) => {
                      if (!sortKey) return 0;
                      const av = a.cells[sortKey] ?? "";
                      const bv = b.cells[sortKey] ?? "";
                      return sortAsc
                        ? String(av).localeCompare(String(bv))
                        : String(bv).localeCompare(String(av));
                    })
                    .map((r, idx) => (
                      <TableRow
                        key={r.id}
                        className={idx % 2 ? "bg-muted/20" : undefined}
                      >
                        <TableCell className="w-8 p-3">
                          <Checkbox
                            checked={rowSelected.has(r.id)}
                            onCheckedChange={(c) => {
                              setRowSelected((prev) => {
                                const next = new Set(prev);
                                if (c) next.add(r.id);
                                else next.delete(r.id);
                                return next;
                              });
                            }}
                          />
                        </TableCell>
                        {displayHeaders.map((h) => (
                          <TableCell
                            key={h}
                            className="p-3 whitespace-normal break-words align-top"
                          >
                            <div className="text-sm leading-5">
                              {r.cells[h] ?? ""}
                            </div>
                          </TableCell>
                        ))}
                        <TableCell className="w-16 p-3">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Remover esta linha?
                                </AlertDialogTitle>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteRows(new Set([r.id]))}
                                >
                                  Remover
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
                <TableCaption>
                  {rows.length} linha(s) • Cabeçalho fixo • Clique no cabeçalho
                  para ordenar
                </TableCaption>
              </Table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
