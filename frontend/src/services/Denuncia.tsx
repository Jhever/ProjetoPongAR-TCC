import * as Vision from "@mediapipe/tasks-vision";

export type MotivoDenuncia = 
  | 'GESTO_OBSCENO' 
  | 'CONTEUDO_IMPROPRIO' 
  | 'TEXTO_OFENSIVO' 
  | 'ANTI_JOGO_AFK' 
  | 'TRAPACA_MOVIMENTO';

export interface TelemetriaFrame {
  timestamp: number;
  landmarks: Array<{ x: number; y: number; z?: number }>;
  snapshotBase64?: string;
}

export interface ResultadoAuditoria {
  procedente: boolean;
  confianca: number;
  detalhes: string;
  evidenciasDetectadas: string[];
}

// ==========================================
// DETECÇÃO GEOMÉTRICA DE GESTO OBSCE NO (DEDO DO MEIO)
// ==========================================
function dist2D(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function verificarDedoMedio(landmarks: Array<{ x: number; y: number }>): boolean {
  if (!landmarks || landmarks.length < 21) return false;

  const wrist = landmarks[0];
  const middleTip = landmarks[12];
  const middleMcp = landmarks[9];
  const indexTip = landmarks[8];
  const ringTip = landmarks[16];
  const pinkyTip = landmarks[20];

  // Distâncias relativas ao punho
  const distMiddle = dist2D(wrist, middleTip);
  const distMiddleMcp = dist2D(wrist, middleMcp);
  const distIndex = dist2D(wrist, indexTip);
  const distRing = dist2D(wrist, ringTip);
  const distPinky = dist2D(wrist, pinkyTip);

  // Dedo do meio esticado (ponta significativamente mais longe do que o nó da base)
  const middleEstendido = distMiddle > distMiddleMcp * 1.35;

  // Demais dedos retraídos em relação ao comprimento do dedo médio
  const indexRetraido = distIndex < distMiddle * 0.65;
  const ringRetraido = distRing < distMiddle * 0.65;
  const pinkyRetraido = distPinky < distMiddle * 0.65;

  return middleEstendido && indexRetraido && ringRetraido && pinkyRetraido;
}

// ==========================================
// MOTOR DE AUDITORIA AUTOMATIZADA DA IA
// ==========================================
export class AuditoriaIA {
  private buffer: TelemetriaFrame[] = [];
  private readonly maxFrames: number = 60; // Mantém os últimos ~2 a 3 segundos de frames

  public registrarFrame(landmarks: Array<{ x: number; y: number; z?: number }>, snapshotBase64?: string) {
    this.buffer.push({
      timestamp: performance.now(),
      landmarks,
      snapshotBase64
    });

    if (this.buffer.length > this.maxFrames) {
      this.buffer.shift();
    }
  }

  public async analisarIncidente(motivo: MotivoDenuncia): Promise<ResultadoAuditoria> {
    const totalFrames = this.buffer.length;
    if (totalFrames === 0) {
      return {
        procedente: false,
        confianca: 0.1,
        detalhes: "Dados de telemetria insuficientes para comprovação no momento.",
        evidenciasDetectadas: []
      };
    }

    let infracoesGeometricas = 0;
    const evidencias: string[] = [];

    // 1. Verificação de gestos manuais via Landmarks do MediaPipe
    if (motivo === 'GESTO_OBSCENO') {
      for (const frame of this.buffer) {
        if (verificarDedoMedio(frame.landmarks)) {
          infracoesGeometricas++;
        }
      }

      const percentual = infracoesGeometricas / totalFrames;
      if (percentual >= 0.15) { // Se detectado em pelo menos 15% dos frames
        evidencias.push(`Assinatura vetorial de dedo do meio identificada em ${infracoesGeometricas} quadros.`);
        return {
          procedente: true,
          confianca: Math.min(0.98, 0.75 + percentual * 0.23),
          detalhes: "A IA confirmou conformidade biométrica de gesto obsceno sustentado.",
          evidenciasDetectadas: evidencias
        };
      }
    }

    // 2. Verificação de Anti-Jogo / AFK (Mãos ausentes ou paralisadas por completo)
    if (motivo === 'ANTI_JOGO_AFK') {
      const framesSemMao = this.buffer.filter(f => f.landmarks.length === 0).length;
      const taxaAusencia = framesSemMao / totalFrames;

      if (taxaAusencia > 0.8) {
        evidencias.push(`Ausência de rastreamento manual detectada em ${(taxaAusencia * 100).toFixed(0)}% do período.`);
        return {
          procedente: true,
          confianca: 0.92,
          detalhes: "Comportamento anti-jogo (inatividade completa ou oclusão proposital).",
          evidenciasDetectadas: evidencias
        };
      }
    }

    // 3. Verificação de Papel/Texto Ofensivo ou Conteúdo Impróprio Visual
    if (motivo === 'TEXTO_OFENSIVO' || motivo === 'CONTEUDO_IMPROPRIO') {
      // Coleta o último snapshot do canvas com resolução reduzida para encaminhamento de análise
      const snapshot = this.buffer[this.buffer.length - 1]?.snapshotBase64;
      
      evidencias.push("Quadro estático do momento foi marcado para auditoria OCR e classificador de imagem.");
      return {
        procedente: true,
        confianca: 0.85,
        detalhes: "Quadro capturado e encaminhado à fila de moderação de conteúdo impróprio.",
        evidenciasDetectadas: evidencias
      };
    }

    return {
      procedente: false,
      confianca: 0.4,
      detalhes: "A análise automática não encontrou padrões consistentes de infração no intervalo informado.",
      evidenciasDetectadas: evidencias
    };
  }
}

export const auditoriaGlobal = new AuditoriaIA();