/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as boasVindasDono } from './boas-vindas-dono.tsx'
import { template as suporteCliente } from './suporte-cliente.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'boas-vindas-dono': boasVindasDono,
  'suporte-cliente': suporteCliente,
}
