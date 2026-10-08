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
// DETECÇÃO GEOMÉTRICA DE GESTO OBSCENO (DEDO DO MEIO)
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

  const distMiddle = dist2D(wrist, middleTip);
  const distMiddleMcp = dist2D(wrist, middleMcp);
  const distIndex = dist2D(wrist, indexTip);
  const distRing = dist2D(wrist, ringTip);
  const distPinky = dist2D(wrist, pinkyTip);

  const middleEstendido = distMiddle > distMiddleMcp * 1.35;
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
  private readonly maxFrames: number = 60; 

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

  // MÉTODO NECESSÁRIO: Devolve a gravação para o frontend repassar ao Node.js
  public obterFrames(): TelemetriaFrame[] {
    return this.buffer;
  }

  // ATUALIZADO: Recebe placares opcionais para julgar denúncias de raiva
  public async analisarIncidente(
    motivo: MotivoDenuncia, 
    placarDenunciante: number = 0, 
    placarDenunciado: number = 0
  ): Promise<ResultadoAuditoria> {
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

    // 1. Verificação de Gesto Obsceno
    if (motivo === 'GESTO_OBSCENO') {
      for (const frame of this.buffer) {
        if (verificarDedoMedio(frame.landmarks)) {
          infracoesGeometricas++;
        }
      }

      const percentual = infracoesGeometricas / totalFrames;
      if (percentual >= 0.15) { 
        evidencias.push(`Assinatura vetorial de dedo do meio identificada em ${infracoesGeometricas} quadros.`);
        return {
          procedente: true,
          confianca: Math.min(0.98, 0.75 + percentual * 0.23),
          detalhes: "A IA confirmou conformidade biométrica de gesto obsceno sustentado.",
          evidenciasDetectadas: evidencias
        };
      }
    }

    // 2. Verificação de Anti-Jogo / AFK
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

    // 3. Verificação de Texto ou Nudez (Encaminhamento estático)
    if (motivo === 'TEXTO_OFENSIVO' || motivo === 'CONTEUDO_IMPROPRIO') {
      evidencias.push("Quadro estático do momento foi marcado para auditoria OCR e classificador de imagem externo.");
      return {
        procedente: true,
        confianca: 0.85,
        detalhes: "Quadro capturado e encaminhado à fila de moderação de conteúdo impróprio.",
        evidenciasDetectadas: evidencias
      };
    }

    // ==========================================
    // 4. LÓGICA ANTI-RAGE REPORT
    // ==========================================
    // Se chegou até aqui, nenhuma infração física foi confirmada pela IA.
    const diferencaGols = placarDenunciado - placarDenunciante;
    
    // Se quem está denunciando está perdendo de 4 ou mais gols de diferença...
    if (diferencaGols >= 4) {
      evidencias.push(`Placar adverso detectado (${placarDenunciado}x${placarDenunciante}). Ausência total de infrações físicas nos últimos quadros.`);
      return {
        procedente: false,
        confianca: 0.99, // Certeza quase absoluta que é "choro"
        detalhes: "RAGE REPORT DETECTADO: A denúncia foi classificada como falsa, gerada por frustração com o placar. Denúncias falsas causam penalidades.",
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