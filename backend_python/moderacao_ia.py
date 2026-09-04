from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import numpy as np

app = FastAPI(title="Moderador AR - Pong TCC")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class Landmark(BaseModel):
    x: float
    y: float
    z: Optional[float] = 0.0

class FrameTelemetria(BaseModel):
    timestamp: float
    landmarks: List[Landmark]

class InspecaoRequest(BaseModel):
    jogador_id: Optional[int] = None
    tipo_denuncia: str
    historico_frames: List[FrameTelemetria]

def dist_euclidiana(p1: Landmark, p2: Landmark) -> float:
    return np.hypot(p1.x - p2.x, p1.y - p2.y)

def verificar_dedo_medio_frame(landmarks: List[Landmark]) -> bool:
    """
    Avalia a geometria dos 21 pontos do MediaPipe no plano 2D normalizado.
    Landmarks-chave:
      0: Pulso
      4: Polegar Tip
      8: Indicador Tip, 5: Indicador MCP
      12: Médio Tip, 9: Médio MCP
      16: Anelar Tip, 13: Anelar MCP
      20: Mínimo Tip, 17: Mínimo MCP
    """
    if len(landmarks) < 21:
        return False

    pulso = landmarks[0]
    medio_tip = landmarks[12]
    medio_mcp = landmarks[9]

    indicador_tip = landmarks[8]
    anelar_tip = landmarks[16]
    minimo_tip = landmarks[20]

    # Distâncias euclidianas em relação ao pulso
    dist_medio = dist_euclidiana(pulso, medio_tip)
    dist_medio_base = dist_euclidiana(pulso, medio_mcp)

    dist_indicador = dist_euclidiana(pulso, indicador_tip)
    dist_anelar = dist_euclidiana(pulso, anelar_tip)
    dist_minimo = dist_euclidiana(pulso, minimo_tip)

    # 1. Dedo médio totalmente estendido
    medio_estendido = dist_medio > (dist_medio_base * 1.35)

    # 2. Demais dedos recolhidos/fechados em direção à palma
    outros_recolhidos = (
        dist_indicador < (dist_medio * 0.68) and
        dist_anelar < (dist_medio * 0.68) and
        dist_minimo < (dist_medio * 0.68)
    )

    return medio_estendido and outros_recolhidos

@app.post("/api/auditoria/analisar-gesto")
def analisar_gesto_recorrente(payload: InspecaoRequest):
    frames = payload.historico_frames
    total_frames = len(frames)

    if total_frames == 0:
        return {
            "procedente": False,
            "confianca": 0.0,
            "detalhes": "Nenhum dado vetorial foi recebido para auditoria."
        }

    ocorrencias = 0
    max_consecutivos = 0
    consecutivos_atuais = 0

    # Varredura temporal dos frames
    for frame in frames:
        if verificar_dedo_medio_frame(frame.landmarks):
            ocorrencias += 1
            consecutivos_atuais += 1
            if consecutivos_atuais > max_consecutivos:
                max_consecutivos = consecutivos_atuais
        else:
            consecutivos_atuais = 0

    taxa_presenca = ocorrencias / total_frames

    # Critério de recorrência:
    # Presente em pelo menos 25% dos quadros OU sustentado por mais de 8 frames seguidos
    infracao_detectada = taxa_presenca >= 0.25 or max_consecutivos >= 8

    confianca = min(0.99, float(0.60 + (taxa_presenca * 0.35))) if infracao_detectada else 0.15

    return {
        "procedente": infracao_detectada,
        "confianca": round(confianca * 100, 1),
        "estatisticas": {
            "total_frames_analisados": total_frames,
            "frames_com_gesto": ocorrencias,
            "max_frames_consecutivos": max_consecutivos,
            "taxa_recorrencia": f"{round(taxa_presenca * 100, 1)}%"
        },
        "detalhes": (
            f"Gesto obsceno detectado de forma recorrente em {ocorrencias} quadros "
            f"(pico de {max_consecutivos} quadros consecutivos)."
            if infracao_detectada
            else "Nenhum padrão ofensivo sustentado foi encontrado nos dados analisados."
        )
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)