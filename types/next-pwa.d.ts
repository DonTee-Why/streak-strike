declare module "next-pwa" {
  type NextPwaOptions = {
    dest?: string;
    disable?: boolean;
    register?: boolean;
    skipWaiting?: boolean;
  };

  function withPWA(options?: NextPwaOptions): <T>(nextConfig: T) => T;
  export default withPWA;
}
