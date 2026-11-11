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
        "versao": "2.0.0 (Com Anti-Rage Report e Filtro 3D)"
    }

# ATUALIZADO: Agora calcula a distância em 3D (X, Y, Z) para evitar bug do queixo
def dist_3d(p1: Landmark, p2: Landmark) -> float:
    z1 = p1.z if p1.z is not None else 0.0
    z2 = p2.z if p2.z is not None else 0.0
    return np.sqrt((p1.x - p2.x)**2 + (p1.y - p2.y)**2 + (z1 - z2)**2)

def verificar_dedo_medio_frame(landmarks: List[Landmark]) -> bool:
    """
    Avalia a geometria dos 21 pontos do MediaPipe no plano 3D normalizado.
    """
    if len(landmarks) < 21:
        return False

    pulso = landmarks[0]
    
    # Pontas dos dedos
    indicador_tip = landmarks[8]
    medio_tip = landmarks[12]
    anelar_tip = landmarks[16]
    minimo_tip = landmarks[20]

    # Base do dedo do meio
    medio_mcp = landmarks[9]

    # Distâncias até o pulso
    dist_medio = dist_3d(pulso, medio_tip)
    dist_indicador = dist_3d(pulso, indicador_tip)
    dist_anelar = dist_3d(pulso, anelar_tip)
    dist_minimo = dist_3d(pulso, minimo_tip)

    # Verifica se o dedo do meio está esticado em relação à própria base (evita falsos positivos de profundidade)
    dist_medio_base = dist_3d(medio_mcp, medio_tip)
    medio_estendido = dist_medio_base > 0.05 

    # Os outros dedos devem estar significativamente mais próximos do pulso do que o dedo do meio
    outros_recolhidos = (
        dist_indicador < (dist_medio * 0.70) and
        dist_anelar < (dist_medio * 0.70) and
        dist_minimo < (dist_medio * 0.70)
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

    # ATUALIZADO: Exige pelo menos 6 frames consecutivos para confirmar a infração (Sustentação)
    infracao_detectada = max_consecutivos >= 6
    
    # 2. SE FOI CULPADO DE VERDADE
    if infracao_detectada:
        confianca = min(0.99, float(0.70 + (max_consecutivos * 0.02)))
        return {
            "procedente": True,
            "confianca": round(confianca * 100, 1),
            "estatisticas": {
                "total_frames_analisados": total_frames,
                "frames_com_gesto": ocorrencias,
                "max_frames_consecutivos": max_consecutivos,
                "taxa_recorrencia": f"{round(taxa_presenca * 100, 1)}%"
            },
            "detalhes": f"Gesto obsceno detectado e sustentado de forma clara por {max_consecutivos} quadros consecutivos."
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
        "detalhes": "Nenhum padrão ofensivo sustentado foi encontrado nos dados biométricos."
    }

if __name__ == "__main__":
    import uvicorn
    porta = int(os.environ.get("PORT", 8000))
    uvicorn.run("moderacao_ia:app", host="0.0.0.0", port=porta, reload=True)