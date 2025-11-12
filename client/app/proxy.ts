import { NextRequest, NextResponse } from 'next/server';

export async function proxy(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const pathname = request.nextUrl.pathname;

  // Rotas protegidas baseadas no seu projeto (ajuste se necessário)
  const protectedPaths = ['/home', '/reservas', '/barbearia'];

  // Verifica se a rota é protegida
  const isProtected = protectedPaths.some(path => pathname.startsWith(path)) || pathname === '/home';

  if (isProtected) {
    if (!token) {
      // Sem token: redireciona para login
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }

    try {
      // Verifica o token no backend (assumindo endpoint /auth/verify)
      const verifyResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!verifyResponse.ok) {
        // Token inválido: redireciona para login
        const loginUrl = new URL('/login', request.url);
        return NextResponse.redirect(loginUrl);
      }

      // Token válido: prossegue
      return NextResponse.next();
    } catch (error) {
      // Erro na verificação (ex.: rede): redireciona para login
      console.error('Erro na verificação do token:', error);
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Para rotas não protegidas: prossegue
  return NextResponse.next();
}

export const config = {
  matcher: [
    {
      // Aplica a rotas específicas, excluindo públicas e internas
      source: '/((?!login|api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
      // Executa apenas se o cookie 'token' estiver ausente
      missing: [{ type: 'cookie', key: 'token' }],
    },
  ],
};