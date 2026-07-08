"use client";

import React from "react";
import { 
  Sparkles, 
  ArrowRight, 
  Camera, 
  MapPin, 
  Calendar, 
  Clock, 
  Layers, 
  Users, 
  BookOpen, 
  ShieldCheck, 
  CheckCircle,
  EyeOff,
  ImageIcon,
  Smartphone,
  Info
} from "lucide-react";

export default function BarberLabPage() {
  // Função para scroll suave até as seções
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="w-screen bg-[#0B0B0E] text-[#F8F7F4] relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] overflow-x-hidden font-sans pb-24">
      {/* 1. HERO SECTION */}
      <section className="relative min-h-[90vh] flex flex-col justify-center items-center px-4 sm:px-8 py-20 bg-gradient-to-b from-[#0B0B0E] via-[#121217] to-[#0B0B0E] border-b border-[#17171C]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(216,164,71,0.08)_0%,transparent_65%)] pointer-events-none" />
        
        <div className="max-w-4xl mx-auto text-center space-y-8 z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D8A447]/10 border border-[#D8A447]/30 text-[#D8A447] text-xs font-semibold uppercase tracking-wider animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            Doodads Barber Lab
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white leading-tight">
            Barbearias de bairro com <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D8A447] via-[#F3EDE2] to-[#D8A447]">
              cara de marca profissional.
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-gray-400 text-lg sm:text-xl max-w-2xl mx-auto font-light leading-relaxed">
            Design acessível, book de fotos, vitrine digital e agenda para ajudar pequenos barbeiros a se apresentarem melhor, conquistarem confiança e ocuparem seu lugar no território.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
            <button
              onClick={() => scrollToSection("impacto")}
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-[#D8A447] to-[#c79236] hover:from-[#c79236] hover:to-[#b5812b] text-[#0B0B0E] font-semibold rounded-xl shadow-lg shadow-[#D8A447]/15 transition duration-300 flex items-center justify-center gap-2 cursor-pointer"
            >
              Conhecer o piloto
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => scrollToSection("funcionamento")}
              className="w-full sm:w-auto px-8 py-3.5 bg-[#17171C] hover:bg-[#2A2A31] border border-[#2A2A31] text-[#F8F7F4] font-medium rounded-xl transition duration-300 cursor-pointer"
            >
              Ver como funciona
            </button>
          </div>

          {/* Badges horizontais */}
          <div className="flex flex-wrap justify-center gap-3 pt-8 max-w-3xl mx-auto">
            {["Design acessível", "Book profissional", "Vitrine digital", "Agenda simples", "Piloto local"].map((badge) => (
              <span key={badge} className="px-3.5 py-1.5 rounded-lg bg-[#17171C] border border-[#2A2A31] text-xs text-gray-300 font-medium">
                {badge}
              </span>
            ))}
          </div>
        </div>

        {/* Mockup de Aplicativo / Card de Perfil */}
        <div className="mt-16 w-full max-w-md mx-auto px-4 z-10">
          <div className="bg-[#17171C] border border-[#2A2A31] rounded-2xl overflow-hidden shadow-2xl shadow-black/80">
            {/* Header com gradiente */}
            <div className="h-44 bg-gradient-to-r from-[#2A2A31] via-[#17171C] to-[#2A2A31] relative flex items-end p-4">
              <div className="absolute inset-0 bg-[#0B0B0E]/40" />
              <div className="absolute top-3 right-3 px-2.5 py-1 rounded bg-[#21A67A] text-[10px] text-white font-bold uppercase tracking-wider">
                Piloto Doodads
              </div>
              <div className="relative z-10 text-left">
                <h3 className="text-lg font-bold text-white">Barbearia do Carlinhos</h3>
                <p className="text-xs text-gray-300 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-[#D8A447]" /> Centro Histórico • 1.2 km de você
                </p>
              </div>
            </div>
            {/* Detalhes de agendamento simulados */}
            <div className="p-4 space-y-4 text-left">
              <div className="flex justify-between items-center text-xs border-b border-[#2A2A31] pb-3 text-gray-400">
                <span>Serviço Premium</span>
                <span className="font-semibold text-white">R$ 40,00</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {["09:00", "10:30", "14:00"].map((time, idx) => (
                  <div 
                    key={time} 
                    className={`py-2 rounded-lg text-center text-xs font-semibold border ${
                      idx === 1 
                        ? "bg-[#D8A447]/15 border-[#D8A447] text-[#D8A447]" 
                        : "bg-[#0B0B0E] border-[#2A2A31] text-gray-400"
                    }`}
                  >
                    {time}
                  </div>
                ))}
              </div>
              <div className="pt-2">
                <div className="w-full py-2.5 bg-[#D8A447]/10 border border-[#D8A447]/40 text-[#D8A447] rounded-xl text-center text-xs font-bold uppercase tracking-wide">
                  Agendar via Doodads Barber Lab
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. O PROBLEMA */}
      <section className="px-4 sm:px-8 py-20 max-w-5xl mx-auto text-center space-y-16">
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-[#D8A447] uppercase tracking-widest">O Desafio</h2>
          <p className="text-3xl sm:text-4xl font-bold text-white">Muitos bons barbeiros ainda parecem invisíveis.</p>
          <p className="text-gray-400 text-base max-w-xl mx-auto font-light">
            Há profissionais competentes que perdem oportunidades porque o espaço não comunica qualidade, as fotos são improvisadas, a presença digital é frágil e o cliente não percebe valor antes de chegar.
          </p>
        </div>

        {/* Grid de Problemas */}
        <div className="grid sm:grid-cols-2 gap-6">
          {[
            {
              title: "Ambiente pouco fotografável",
              desc: "A falta de iluminação correta ou organização visual esconde os detalhes de capricho do estabelecimento nas fotos de redes sociais."
            },
            {
              title: "Identidade visual frágil",
              desc: "Fachadas apagadas e ausência de uma comunicação coerente dificultam a atração de novos clientes que transitam pelo bairro."
            },
            {
              title: "Baixa presença digital",
              desc: "Não aparecer no mapa digital ou depender exclusivamente de mensagens no chat para responder dúvidas gera perda de agendamentos."
            },
            {
              title: "Agenda desorganizada",
              desc: "Barbeiros que perdem tempo no telefone anotando horários em cadernos de papel, gerando furos e conflito de horários."
            }
          ].map((item, idx) => (
            <div key={idx} className="bg-[#17171C] border border-[#2A2A31] p-6 rounded-2xl text-left space-y-3 hover:border-gray-700 transition duration-300">
              <div className="w-8 h-8 rounded-lg bg-red-900/20 border border-red-500/30 flex items-center justify-center text-red-400 font-bold text-sm">
                0{idx + 1}
              </div>
              <h4 className="text-lg font-semibold text-white">{item.title}</h4>
              <p className="text-xs text-gray-400 leading-relaxed font-light">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. A SOLUÇÃO */}
      <section id="funcionamento" className="px-4 sm:px-8 py-20 bg-gradient-to-b from-[#0B0B0E] via-[#121217] to-[#0B0B0E] border-y border-[#17171C]">
        <div className="max-w-5xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-xs font-bold text-[#D8A447] uppercase tracking-widest">O Método</h2>
            <p className="text-3xl sm:text-4xl font-bold text-white">Do espelho à vitrine digital.</p>
            <p className="text-gray-400 text-sm max-w-lg mx-auto font-light">
              Nossa equipe atua em quatro frentes integradas de transformação rápida para posicionar as barbearias de bairro no mapa.
            </p>
          </div>

          {/* Cards de Passos */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <Layers className="w-5 h-5 text-[#D8A447]" />,
                title: "1. Diagnóstico visual",
                desc: "Observamos iluminação, fachada, circulação, organização, identidade visual e pontos de melhoria."
              },
              {
                icon: <Sparkles className="w-5 h-5 text-[#D8A447]" />,
                title: "2. Adequação acessível",
                desc: "Propomos ajustes simples, seguros e de baixo custo para tornar o espaço mais atrativo e fotografável."
              },
              {
                icon: <Camera className="w-5 h-5 text-[#D8A447]" />,
                title: "3. Book da barbearia",
                desc: "Produzimos imagens do ambiente, dos serviços e dos diferenciais reais do negócio."
              },
              {
                icon: <Smartphone className="w-5 h-5 text-[#D8A447]" />,
                title: "4. Perfil no Doodads",
                desc: "A barbearia ganha uma vitrine digital com fotos, serviços, horários e agenda."
              }
            ].map((step, idx) => (
              <div key={idx} className="bg-[#17171C] border border-[#2A2A31] p-6 rounded-2xl space-y-4 hover:border-[#D8A447]/40 transition duration-300">
                <div className="w-10 h-10 rounded-xl bg-[#D8A447]/10 flex items-center justify-center border border-[#D8A447]/20">
                  {step.icon}
                </div>
                <h4 className="text-base font-bold text-white">{step.title}</h4>
                <p className="text-xs text-gray-400 leading-relaxed font-light">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. ANTES E DEPOIS */}
      <section className="px-4 sm:px-8 py-20 max-w-5xl mx-auto space-y-16">
        <div className="text-center space-y-4">
          <h2 className="text-xs font-bold text-[#D8A447] uppercase tracking-widest">Transformação</h2>
          <p className="text-3xl sm:text-4xl font-bold text-white">Pequenas mudanças. Grande diferença na percepção.</p>
          <p className="text-gray-400 text-sm max-w-lg mx-auto font-light">
            Veja o impacto prático de um espaço organizado e fotografado com técnica profissional.
          </p>
        </div>

        {/* Layout de Comparação */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Antes */}
          <div className="bg-[#17171C] border border-[#2A2A31] rounded-2xl overflow-hidden shadow-lg">
            <div className="h-56 bg-gradient-to-br from-[#2A2A31]/20 to-[#17171C] flex items-center justify-center border-b border-[#2A2A31] relative">
              <EyeOff className="w-12 h-12 text-gray-600" />
              <span className="absolute top-4 left-4 px-2.5 py-1 rounded bg-[#2A2A31] text-[10px] text-gray-400 font-bold uppercase">Antes</span>
            </div>
            <div className="p-5 space-y-2 text-left">
              <h4 className="text-base font-bold text-gray-300">Espaço sem Preparação Visual</h4>
              <p className="text-xs text-gray-400 font-light leading-relaxed">
                Ambiente com iluminação inadequada, poluição visual na parede de trabalho e fotos tremidas feitas com celular sem enquadramento ideal. Dificulta a percepção de qualidade do serviço antes de o cliente visitar a barbearia.
              </p>
            </div>
          </div>

          {/* Depois */}
          <div className="bg-[#17171C] border border-[#D8A447]/30 rounded-2xl overflow-hidden shadow-2xl shadow-[#D8A447]/5">
            <div className="h-56 bg-gradient-to-br from-[#D8A447]/10 to-[#17171C] flex items-center justify-center border-b border-[#2A2A31] relative">
              <ImageIcon className="w-12 h-12 text-[#D8A447]" />
              <span className="absolute top-4 left-4 px-2.5 py-1 rounded bg-[#D8A447] text-[10px] text-[#0B0B0E] font-bold uppercase">Depois (Piloto)</span>
            </div>
            <div className="p-5 space-y-2 text-left">
              <h4 className="text-base font-bold text-[#D8A447]">Espaço Preparado e Fotografado</h4>
              <p className="text-xs text-gray-300 font-light leading-relaxed">
                Iluminação ajustada com spots acessíveis, fundo de corte limpo e harmônico, e book fotográfico profissional de alta resolução. Destaque dos materiais de trabalho e vitrine digital otimizada que gera confiança e desejo de agendamento.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. APP / VITRINE DIGITAL */}
      <section className="px-4 sm:px-8 py-20 bg-gradient-to-b from-[#0B0B0E] via-[#121217] to-[#0B0B0E] border-y border-[#17171C]">
        <div className="max-w-5xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-xs font-bold text-[#D8A447] uppercase tracking-widest">Presença Digital</h2>
            <p className="text-3xl sm:text-4xl font-bold text-white">Uma vitrine simples para o cliente conhecer, escolher e agendar.</p>
            <p className="text-gray-400 text-sm max-w-lg mx-auto font-light">
              Diferente de sistemas engessados, o perfil da barbearia no Doodads prioriza a praticidade sem fricções tecnológicas desnecessárias.
            </p>
          </div>

          {/* Cards Funcionais */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "Perfil da barbearia", desc: "Nome, endereço físico no mapa, contato e descrição clara do local." },
              { title: "Fotos profissionais", desc: "Galeria de imagens reais de alta qualidade exibindo o ambiente e cortes reais." },
              { title: "Lista de serviços", desc: "Listagem de serviços cadastrados com preço, duração e descrição clara." },
              { title: "Horários disponíveis", desc: "Grade de atendimento sempre atualizada, evitando duplicidade de horários." },
              { title: "Agenda simples", desc: "Agendamento rápido feito em poucos cliques pelo celular do cliente." },
              { title: "Pagamento fora do app", desc: "Liquidação financeira direta com a barbearia, sem cobrança de taxas no app." }
            ].map((card, idx) => (
              <div key={idx} className="bg-[#17171C] border border-[#2A2A31] p-6 rounded-xl text-left space-y-2">
                <CheckCircle className="w-5 h-5 text-[#21A67A]" />
                <h4 className="text-base font-bold text-white pt-1">{card.title}</h4>
                <p className="text-xs text-gray-400 font-light leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>

          {/* Nota Obrigatória de Não Custódia */}
          <div className="max-w-3xl mx-auto p-4 rounded-xl bg-[#2A2A31]/30 border border-[#2A2A31] flex gap-3 text-left">
            <Info className="w-5 h-5 text-[#D8A447] shrink-0 mt-0.5" />
            <p className="text-xs text-gray-300 leading-relaxed font-light">
              <span className="font-bold text-[#D8A447]">Nota de Transparência:</span> O Doodads não recebe, processa, divide ou custodia pagamentos dos serviços prestados. Quando houver cobrança ou política de adiantamento Pix, a transação financeira ocorre diretamente por fora da plataforma, combinada e confirmada humanamente entre cliente e barbearia.
            </p>
          </div>
        </div>
      </section>

      {/* 6. IMPACTO NO TERRITÓRIO */}
      <section id="impacto" className="px-4 sm:px-8 py-20 max-w-5xl mx-auto space-y-16">
        <div className="text-center space-y-4">
          <h2 className="text-xs font-bold text-[#D8A447] uppercase tracking-widest">Impacto Social</h2>
          <p className="text-3xl sm:text-4xl font-bold text-white">Tecnologia aplicada ao comércio real do bairro.</p>
          <p className="text-gray-400 text-sm max-w-xl mx-auto font-light">
            O piloto do Doodads Barber Lab atua de forma colaborativa para testar como soluções integradas de economia criativa e design podem revigorar microempreendimentos locais.
          </p>
        </div>

        {/* Indicadores */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { metric: "Até 3", label: "barbearias-piloto" },
            { metric: "90 dias", label: "de uso gratuito" },
            { metric: "5+", label: "fotos finais por negócio" },
            { metric: "100%", label: "perfis publicados" },
            { metric: "Humano", label: "feedback constante" }
          ].map((stat, idx) => (
            <div key={idx} className="bg-[#17171C] border border-[#2A2A31] p-6 rounded-xl text-center space-y-2">
              <div className="text-2xl sm:text-3xl font-extrabold text-[#D8A447]">{stat.metric}</div>
              <div className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. PROTAGONISMO ESTUDANTIL */}
      <section className="px-4 sm:px-8 py-20 bg-gradient-to-b from-[#0B0B0E] via-[#121217] to-[#0B0B0E] border-y border-[#17171C]">
        <div className="max-w-5xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-xs font-bold text-[#D8A447] uppercase tracking-widest">Aprender Fazendo</h2>
            <p className="text-3xl sm:text-4xl font-bold text-white">Os estudantes não apenas aprendem. Eles constroem.</p>
            <p className="text-gray-400 text-sm max-w-lg mx-auto font-light">
              A equipe participa ativamente de cada etapa da intervenção prática, conectando teoria à economia de bairro.
            </p>
          </div>

          {/* Timeline de Protagonismo */}
          <div className="grid sm:grid-cols-5 gap-4 relative">
            {[
              { phase: "Observar", desc: "Estudo do território e diagnóstico do espaço." },
              { phase: "Criar", desc: "Desenho da proposta estética e visual." },
              { phase: "Fotografar", desc: "Produção fotográfica dos diferenciais." },
              { phase: "Publicar", desc: "Estruturação da vitrine digital no Doodads." },
              { phase: "Avaliar", desc: "Coleta de feedback e análise dos resultados." }
            ].map((item, idx) => (
              <div key={idx} className="bg-[#17171C] border border-[#2A2A31] p-5 rounded-xl text-left space-y-2 relative hover:border-[#D8A447]/30 transition duration-300">
                <div className="w-6 h-6 rounded-full bg-[#D8A447]/10 border border-[#D8A447]/30 flex items-center justify-center text-[10px] font-bold text-[#D8A447]">
                  {idx + 1}
                </div>
                <h4 className="text-sm font-bold text-white">{item.phase}</h4>
                <p className="text-[11px] text-gray-400 leading-relaxed font-light">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. GOVERNANÇA E CONFIANÇA */}
      <section className="px-4 sm:px-8 py-20 max-w-3xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-xs font-bold text-[#D8A447] uppercase tracking-widest">Governança</h2>
          <p className="text-2xl sm:text-3xl font-bold text-white">Bonito, útil e responsável.</p>
        </div>

        {/* Checklist de Governança */}
        <div className="bg-[#17171C] border border-[#2A2A31] rounded-2xl p-6 sm:p-8 space-y-4">
          {[
            "Sem Pix real integrado no código do aplicativo",
            "Sem qualquer tipo de gateway ou processador de pagamento",
            "Sem intermediação ou custódia de dinheiro de clientes",
            "Sem promessas infundadas de faturamento comercial",
            "Sem uso de imagem do espaço ou equipe sem autorização por escrito",
            "Sem intervenção estrutural arriscada ou reformas invasivas",
            "Com total transparência sobre os limites e duração do piloto"
          ].map((item) => (
            <div key={item} className="flex items-start gap-3 text-left">
              <ShieldCheck className="w-5 h-5 text-[#21A67A] shrink-0 mt-0.5" />
              <span className="text-xs sm:text-sm text-gray-300 leading-relaxed font-light">{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 9. CTA FINAL */}
      <section className="px-4 sm:px-8 py-20 max-w-4xl mx-auto text-center space-y-12">
        <div className="space-y-6">
          <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-tight leading-tight">
            Uma barbearia pode mudar a forma como é percebida antes mesmo do primeiro corte.
          </h2>
          <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto font-light leading-relaxed">
            O Doodads Barber Lab mostra como design, fotografia e tecnologia podem fortalecer pequenos negócios locais sem perder simplicidade, ética e transparência.
          </p>
        </div>

        {/* Botões do CTA Final */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 max-w-md mx-auto pt-4">
          <button
            onClick={() => scrollToSection("impacto")}
            className="w-full px-8 py-3.5 bg-gradient-to-r from-[#D8A447] to-[#c79236] hover:from-[#c79236] hover:to-[#b5812b] text-[#0B0B0E] font-semibold rounded-xl shadow-lg transition duration-300 cursor-pointer"
          >
            Conhecer o piloto
          </button>
          <button
            onClick={() => window.location.href = "/"}
            className="w-full px-8 py-3.5 bg-[#17171C] hover:bg-[#2A2A31] border border-[#2A2A31] text-[#F8F7F4] font-medium rounded-xl transition duration-300 cursor-pointer"
          >
            Ver demonstração
          </button>
        </div>
      </section>
    </div>
  );
}
