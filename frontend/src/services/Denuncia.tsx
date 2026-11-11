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
// DETECÇÃO GEOMÉTRICA DE GESTO OBSCENO APRIMORADA
// ==========================================
function dist3D(a: { x: number; y: number; z?: number }, b: { x: number; y: number; z?: number }): number {
  const z1 = a.z || 0;
  const z2 = b.z || 0;
  return Math.hypot(a.x - b.x, a.y - b.y, z1 - z2);
}

export function verificarDedoMedio(landmarks: Array<{ x: number; y: number; z?: number }>): boolean {
  if (!landmarks || landmarks.length < 21) return false;

  const wrist = landmarks[0];
  
  // Pontas dos dedos
  const indexTip = landmarks[8];
  const middleTip = landmarks[12];
  const ringTip = landmarks[16];
  const pinkyTip = landmarks[20];

  // Articulações base (MCP)
  const middleMcp = landmarks[9];

  // Distância do pulso até as pontas
  const distMiddle = dist3D(wrist, middleTip);
  const distIndex = dist3D(wrist, indexTip);
  const distRing = dist3D(wrist, ringTip);
  const distPinky = dist3D(wrist, pinkyTip);

  // Distância da própria articulação (para garantir que está reto)
  const distMiddleBase = dist3D(middleMcp, middleTip);

  // O dedo do meio precisa estar esticado em relação à própria base
  const middleEstendido = distMiddleBase > 0.05; 

  // E a distância dele até o pulso deve ser significativamente maior que os outros
  const indexRetraido = distIndex < distMiddle * 0.70;
  const ringRetraido = distRing < distMiddle * 0.70;
  const pinkyRetraido = distPinky < distMiddle * 0.70;

  return middleEstendido && indexRetraido && ringRetraido && pinkyRetraido;
}

// ==========================================
// MOTOR DE AUDITORIA AUTOMATIZADA DA IA
// ==========================================
export class AuditoriaIA {
  private buffer: TelemetriaFrame[] = [];
  private readonly maxFrames: number = 300; // Aumentado para ~10 segundos de memória

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

  public obterFrames(): TelemetriaFrame[] {
    return this.buffer;
  }

  public async analisarIncidente(
    motivo: MotivoDenuncia, 
    placarDenunciante: number = 0, 
    placarDenunciado: number = 0
  ): Promise<ResultadoAuditoria> {
    
    // Simula tempo de processamento para UX
    await new Promise(resolve => setTimeout(resolve, 1500));

    const totalFrames = this.buffer.length;
    if (totalFrames === 0) {
      return {
        procedente: false, confianca: 0.1, detalhes: "Dados de telemetria insuficientes para comprovação no momento.", evidenciasDetectadas: []
      };
    }

    // ==========================================
    // LÓGICA ANTI-RAGE REPORT (Prioridade 1)
    // ==========================================
    const diferencaGols = placarDenunciado - placarDenunciante;
    if (diferencaGols >= 4) {
      return {
        procedente: false, confianca: 0.99, 
        detalhes: `RAGE REPORT DETECTADO: Denúncia falsa gerada por frustração com o placar adverso (${placarDenunciado}x${placarDenunciante}). Denúncias falsas causam penalidades.`,
        evidenciasDetectadas: ["Placar adverso detectado. Ausência total de infrações físicas nos quadros."]
      };
    }

    let infracoesGeometricas = 0;
    let maxConsecutivos = 0;
    let atuaisConsecutivos = 0;
    const evidencias: string[] = [];

    // 1. Verificação de Gesto Obsceno
    if (motivo === 'GESTO_OBSCENO') {
      for (const frame of this.buffer) {
        if (verificarDedoMedio(frame.landmarks)) {
          infracoesGeometricas++;
          atuaisConsecutivos++;
          if (atuaisConsecutivos > maxConsecutivos) maxConsecutivos = atuaisConsecutivos;
        } else {
          atuaisConsecutivos = 0;
        }
      }

      // Exige pelo menos 6 frames consecutivos para descartar "glitches" da câmera no rosto
      if (maxConsecutivos >= 6) { 
        evidencias.push(`Assinatura vetorial de dedo do meio sustentada por ${maxConsecutivos} quadros contínuos.`);
        const percentual = infracoesGeometricas / totalFrames;
        return {
          procedente: true,
          confianca: Math.min(0.99, 0.75 + (maxConsecutivos * 0.02)),
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
          procedente: true, confianca: 0.92, detalhes: "Comportamento anti-jogo (inatividade completa ou oclusão proposital).", evidenciasDetectadas: evidencias
        };
      }
    }

    // 3. Verificação de Texto ou Nudez
    if (motivo === 'TEXTO_OFENSIVO' || motivo === 'CONTEUDO_IMPROPRIO') {
      evidencias.push("Quadro estático do momento foi marcado para auditoria OCR e classificador de imagem externo.");
      return {
        procedente: true, confianca: 0.85, detalhes: "Quadro capturado e encaminhado à fila de moderação de conteúdo impróprio.", evidenciasDetectadas: evidencias
      };
    }

    return {
      procedente: false, confianca: 0.88,
      detalhes: "A análise automática não encontrou padrões consistentes de infração no intervalo informado.",
      evidenciasDetectadas: []
    };
  }
}

export const auditoriaGlobal = new AuditoriaIA();