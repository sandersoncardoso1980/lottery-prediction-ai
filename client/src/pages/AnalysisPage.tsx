import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { trpc } from "@/lib/trpc";
import { Upload, AlertCircle, CheckCircle } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface AnalysisResult {
  success: boolean;
  stats: {
    totalDraws: number;
    hotNumbers: number[];
    coldNumbers: number[];
    mostFrequentNumber: number;
    leastFrequentNumber: number;
    numberFrequency: Record<number, number>;
    distribution: {
      low: number;
      mid: number;
      high: number;
    };
    topPairs: Array<{ pair: [number, number]; frequency: number }>;
  };
  predictions: {
    statistical: number[];
    ai: number[];
    confidence: number;
  };
  analysis: string;
  reasoning: string;
}

export default function AnalysisPage() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [lotteryType, setLotteryType] = useState<"lotofacil" | "megasena">("lotofacil");
  const [groqApiKey, setGroqApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const analyzeMutation = trpc.lottery.analyze.useMutation({
    onSuccess: (data) => {
      setResult(data);
      toast.success("Análise concluída com sucesso!");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const analyzeFile = async () => {
    if (!file || !groqApiKey || !lotteryType) {
      toast.error("Por favor, preencha todos os campos");
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const fileBuffer = Buffer.from(buffer);

      analyzeMutation.mutate({
        fileBuffer,
        lotteryType,
        groqApiKey,
        fileName: file.name,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao processar arquivo";
      toast.error(errorMessage);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.match(/\.(xlsx|xls|csv)$/i)) {
        toast.error("Por favor, selecione um arquivo Excel válido");
        return;
      }
      setFile(selectedFile);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b-4 border-accent">
        <div className="container py-8 md:py-12">
          <h1 className="text-4xl md:text-6xl font-bold uppercase tracking-tight mb-2">
            Lottery Prediction AI
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground uppercase tracking-wide">
            Análise Inteligente de Sorteios com IA
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-2">
            <div className="card-brutalista mb-8">
              <h2 className="text-2xl md:text-3xl font-bold uppercase mb-6">Upload de Dados</h2>

              {/* Lottery Type Selection */}
              <div className="mb-6">
                <Label className="block text-sm font-bold uppercase mb-2">Tipo de Loteria</Label>
                <Select value={lotteryType} onValueChange={(value: any) => setLotteryType(value)}>
                  <SelectTrigger className="w-full bg-input border-2 border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lotofacil">Lotofácil (25 números)</SelectItem>
                    <SelectItem value="megasena">Mega Sena (60 números)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* File Upload */}
              <div className="mb-6">
                <Label className="block text-sm font-bold uppercase mb-2">Arquivo Excel</Label>
                <div
                  className="border-2 border-dashed border-accent p-8 text-center cursor-pointer hover:bg-accent hover:bg-opacity-10 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mx-auto mb-4 w-12 h-12" />
                  <p className="font-bold uppercase mb-2">
                    {file ? file.name : "Clique ou arraste seu arquivo"}
                  </p>
                  <p className="text-sm text-muted-foreground">Formatos: .xlsx, .xls, .csv</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* API Key */}
              <div className="mb-6">
                <Label className="block text-sm font-bold uppercase mb-2">Chave da API Groq</Label>
                <div className="relative">
                  <Input
                    type={showApiKey ? "text" : "password"}
                    value={groqApiKey}
                    onChange={(e) => setGroqApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="bg-input border-2 border-border pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showApiKey ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Obtenha sua chave em{" "}
                  <a
                    href="https://console.groq.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline"
                  >
                    console.groq.com
                  </a>
                </p>
              </div>

              {/* Submit Button */}
              <Button
                onClick={analyzeFile}
                disabled={analyzeMutation.isPending || !file || !groqApiKey}
                className="btn-primary w-full"
              >
                {analyzeMutation.isPending ? (
                  <>
                    <Spinner className="mr-2 w-4 h-4" />
                    Analisando...
                  </>
                ) : (
                  "Iniciar Análise"
                )}
              </Button>
            </div>

            {/* Info Box */}
            <div className="card-brutalista bg-muted bg-opacity-20">
              <h3 className="font-bold uppercase mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Como usar
              </h3>
              <ul className="space-y-2 text-sm">
                <li>• Prepare um arquivo Excel com os números dos sorteios anteriores</li>
                <li>• Cada linha deve conter os números de um sorteio</li>
                <li>• Selecione o tipo de loteria (Lotofácil ou Mega Sena)</li>
                <li>• Insira sua chave da API Groq (gratuita)</li>
                <li>• Clique em "Iniciar Análise" para gerar previsões</li>
              </ul>
            </div>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-1">
            {result ? (
              <div className="card-brutalista sticky top-8">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-6 h-6 text-accent" />
                  <h3 className="font-bold uppercase text-lg">Análise Concluída</h3>
                </div>

                <div className="space-y-4 text-sm">
                  <div>
                    <p className="font-bold uppercase text-xs text-muted-foreground mb-1">
                      Total de Sorteios
                    </p>
                    <p className="text-xl font-bold">{result.stats.totalDraws}</p>
                  </div>

                  <div className="border-t border-border pt-4">
                    <p className="font-bold uppercase text-xs text-muted-foreground mb-2">
                      Top 5 Números Quentes
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {result.stats.hotNumbers.slice(0, 5).map((num) => (
                        <span
                          key={num}
                          className="bg-accent text-accent-foreground px-2 py-1 font-bold text-xs"
                        >
                          {num}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-border pt-4">
                    <p className="font-bold uppercase text-xs text-muted-foreground mb-2">
                      Confiança da IA
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-input border border-border h-2">
                        <div
                          className="bg-accent h-full transition-all"
                          style={{ width: `${result.predictions.confidence}%` }}
                        />
                      </div>
                      <span className="font-bold">{result.predictions.confidence}%</span>
                    </div>
                  </div>

                  <div className="border-t border-border pt-4">
                    <p className="font-bold uppercase text-xs text-muted-foreground mb-2">
                      Número Mais Frequente
                    </p>
                    <p className="text-2xl font-bold text-accent">{result.stats.mostFrequentNumber}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card-brutalista text-center">
                <div className="text-6xl mb-4">📊</div>
                <p className="font-bold uppercase text-sm text-muted-foreground">
                  Resultados aparecerão aqui
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Results Details */}
        {result && (
          <div className="mt-12 border-t-4 border-accent pt-12">
            <h2 className="text-3xl md:text-4xl font-bold uppercase mb-8">Resultados Detalhados</h2>

            {/* Gráfico de Frequência */}
            <div className="card-brutalista mb-8">
              <h3 className="font-bold uppercase mb-6">Frequência dos Top 15 Números</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={result.stats.hotNumbers.slice(0, 15).map((num) => ({
                    number: num,
                    frequency: result.stats.numberFrequency[num],
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="number" stroke="hsl(var(--foreground))" />
                  <YAxis stroke="hsl(var(--foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "2px solid hsl(var(--accent))",
                      color: "hsl(var(--foreground))",
                    }}
                  />
                  <Bar dataKey="frequency" fill="hsl(var(--accent))" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Distribuição de Números */}
            <div className="card-brutalista mb-8">
              <h3 className="font-bold uppercase mb-6">Distribuição por Faixa</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Baixa", value: result.stats.distribution.low },
                      { name: "Média", value: result.stats.distribution.mid },
                      { name: "Alta", value: result.stats.distribution.high },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill="hsl(var(--accent))" />
                    <Cell fill="hsl(var(--muted))" />
                    <Cell fill="hsl(var(--input))" />
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "2px solid hsl(var(--accent))",
                      color: "hsl(var(--foreground))",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {/* Statistical Prediction */}
              <div className="card-brutalista">
                <h3 className="font-bold uppercase mb-4">Previsão Estatística</h3>
                <div className="flex flex-wrap gap-2">
                  {result.predictions.statistical.map((num) => (
                    <span
                      key={num}
                      className="bg-foreground text-background px-3 py-2 font-bold text-sm"
                    >
                      {num}
                    </span>
                  ))}
                </div>
              </div>

              {/* AI Prediction */}
              <div className="card-brutalista">
                <h3 className="font-bold uppercase mb-4">Previsão IA (Groq)</h3>
                <div className="flex flex-wrap gap-2">
                  {result.predictions.ai.map((num) => (
                    <span
                      key={num}
                      className="bg-accent text-accent-foreground px-3 py-2 font-bold text-sm"
                    >
                      {num}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Analysis Text */}
            <div className="card-brutalista">
              <h3 className="font-bold uppercase mb-4">Análise Detalhada</h3>
              <p className="text-sm leading-relaxed mb-4 whitespace-pre-wrap">{result.analysis}</p>
              <div className="border-t border-border pt-4">
                <h4 className="font-bold uppercase text-sm mb-2">Raciocínio</h4>
                <p className="text-sm text-muted-foreground">{result.reasoning}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
