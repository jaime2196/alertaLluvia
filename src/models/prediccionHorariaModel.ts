export interface PrediccionHoraria {
    origen:     Origen;
    elaborado:  Date;
    nombre:     string;
    provincia:  string;
    prediccion: Prediccion;
    id:         string;
    version:    string;
}

export interface Origen {
    productor: string;
    web:       string;
    enlace:    string;
    language:  string;
    copyright: string;
    notaLegal: string;
}

export interface Prediccion {
    dia: Dia[];
}

export interface Dia {
    estadoCielo:       EstadoCielo[];
    precipitacion:     PeriodoValor[];
    probPrecipitacion: PeriodoValor[];
    probTormenta:      PeriodoValor[];
    nieve:             PeriodoValor[];
    probNieve:         PeriodoValor[];
    temperatura:       PeriodoValor[];
    sensTermica:       PeriodoValor[];
    humedadRelativa:   PeriodoValor[];
    vientoAndRachaMax: VientoAndRachaMax[];
    fecha:             Date;
    orto:              string;
    ocaso:             string;
}

export interface EstadoCielo {
    value:       string;
    periodo:     string;
    descripcion: Descripcion;
}

export enum Descripcion {
    Cubierto = "Cubierto",
    Despejado = "Despejado",
    MuyNuboso = "Muy nuboso",
    NubesAltas = "Nubes altas",
    Nuboso = "Nuboso",
    PocoNuboso = "Poco nuboso",
}

export interface PeriodoValor {
    value:   string;
    periodo: string;
}

export interface VientoAndRachaMax {
    direccion?: string[];
    velocidad?: string[];
    periodo:    string;
    value?:     string;
}

export enum Weather{
    Storm = 0,
    Rain = 1,
    Snow = 2,
}