import os
from typing import List, Optional
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
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
    # NOVOS CAMPOS: Recebendo o placar para contexto
    placar_denunciante: Optional[int] = 0
    placar_denunciado: Optional[int] = 0

# Rota raiz para diagnóstico no navegador e health check
@app.get("/")
def health_check():
    return {
        "status": "online",
        "servico": "Moderador AR - Pong TCC",
        "versao": "1.1.0 (Com Anti-Rage Report)"
    }

def dist_euclidiana(p1: Landmark, p2: Landmark) -> float:
    return np.hypot(p1.x - p2.x, p1.y - p2.y)

def verificar_dedo_medio_frame(landmarks: List[Landmark]) -> bool:
    """
    Avalia a geometria dos 21 pontos do MediaPipe no plano 2D normalizado.
    """
    if len(landmarks) < 21:
        return False

    pulso = landmarks[0]
    medio_tip = landmarks[12]
    medio_mcp = landmarks[9]

    indicador_tip = landmarks[8]
    anelar_tip = landmarks[16]
    minimo_tip = landmarks[20]

    dist_medio = dist_euclidiana(pulso, medio_tip)
    dist_medio_base = dist_euclidiana(pulso, medio_mcp)

    dist_indicador = dist_euclidiana(pulso, indicador_tip)
    dist_anelar = dist_euclidiana(pulso, anelar_tip)
    dist_minimo = dist_euclidiana(pulso, minimo_tip)

    medio_estendido = dist_medio > (dist_medio_base * 1.35)

    outros_recolhidos = (
        dist_indicador < (dist_medio * 0.68) and
        dist_anelar < (dist_medio * 0.68) and
        dist_minimo < (dist_medio * 0.68)
    )

    return medio_estendido and outros_recolhidos

@app.get("/api/auditoria/analisar-gesto")
def info_analise():
    return {"message": "Envie os dados vetoriais via POST para este endpoint."}

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

    # 1. Varredura temporal dos quadros procurando a infração
    for frame in frames:
        if verificar_dedo_medio_frame(frame.landmarks):
            ocorrencias += 1
            consecutivos_atuais += 1
            if consecutivos_atuais > max_consecutivos:
                max_consecutivos = consecutivos_atuais
        else:
            consecutivos_atuais = 0

    taxa_presenca = ocorrencias / total_frames

    # Critério de detecção: presente em >= 25% dos quadros OU 8 frames consecutivos
    infracao_detectada = taxa_presenca >= 0.25 or max_consecutivos >= 8
    
    # 2. SE FOI CULPADO DE VERDADE
    if infracao_detectada:
        confianca = min(0.99, float(0.60 + (taxa_presenca * 0.35)))
        return {
            "procedente": True,
            "confianca": round(confianca * 100, 1),
            "estatisticas": {
                "total_frames_analisados": total_frames,
                "frames_com_gesto": ocorrencias,
                "max_frames_consecutivos": max_consecutivos,
                "taxa_recorrencia": f"{round(taxa_presenca * 100, 1)}%"
            },
            "detalhes": f"Gesto obsceno detectado de forma recorrente em {ocorrencias} quadros (pico de {max_consecutivos} consecutivos)."
        }

    # ==========================================
    # 3. LÓGICA ANTI-RAGE REPORT
    # (Se chegou aqui, ele NÃO fez gesto nenhum. Vamos ver o placar)
    # ==========================================
    diferenca_gols = payload.placar_denunciado - payload.placar_denunciante

    if diferenca_gols >= 4:
        return {
            "procedente": False,
            "confianca": 99.9, # Certeza quase absoluta que é "choro"
            "estatisticas": {
                "total_frames_analisados": total_frames,
                "diferenca_placar": diferenca_gols
            },
            "detalhes": f"RAGE REPORT DETECTADO: A denúncia foi classificada como falsa, gerada por frustração com o placar adverso ({payload.placar_denunciado}x{payload.placar_denunciante}). Denúncias falsas causam penalidades ao denunciante."
        }

    # 4. Inocente comum (não fez gesto, e o placar está equilibrado)
    return {
        "procedente": False,
        "confianca": 85.0,
        "estatisticas": {
            "total_frames_analisados": total_frames
        },
        "detalhes": "Nenhum padrão ofensivo sustentado foi encontrado nos dados analisados."
    }

if __name__ == "__main__":
    import uvicorn
    porta = int(os.environ.get("PORT", 8000))
    uvicorn.run("moderacao_ia:app", host="0.0.0.0", port=porta, reload=True)