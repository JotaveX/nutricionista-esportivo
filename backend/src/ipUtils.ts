// Trunca o IP antes de persistir, reduzindo a identificabilidade do dado
// guardado (LGPD art. 6º, III - minimização) sem perder granularidade útil
// para métricas agregadas, já que país/cidade são resolvidos e guardados à parte.
export function truncateIp(ip: string): string {
    return ip.includes(':') ? truncateIpv6(ip) : truncateIpv4(ip);
}

function truncateIpv4(ip: string): string {
    const parts = ip.split('.');
    if (parts.length !== 4) return ip;
    parts[3] = '0';
    return parts.join('.');
}

function truncateIpv6(ip: string): string {
    const [head, tail] = ip.split('::');
    let groups: string[];

    if (tail !== undefined) {
        const headGroups = head ? head.split(':') : [];
        const tailGroups = tail ? tail.split(':') : [];
        const missing = 8 - headGroups.length - tailGroups.length;
        groups = [...headGroups, ...Array(Math.max(missing, 0)).fill('0'), ...tailGroups];
    } else {
        groups = ip.split(':');
    }

    // Formato inesperado (ex: IPv4-mapeado em IPv6): não trunca em vez de arriscar corromper o valor.
    if (groups.length !== 8) return ip;

    return [...groups.slice(0, 3), '0', '0', '0', '0', '0'].join(':');
}
