const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

type TurnstileResponse = {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  action?: string;
  cdata?: string;
  "error-codes"?: string[];
};

type TurnstileResult = {
  success: boolean;
  error?: string;
  codes?: string[];
  skipped?: boolean;
};

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const firstForwardedIp = forwardedFor?.split(",")[0]?.trim();

  return (
    request.headers.get("cf-connecting-ip") ??
    firstForwardedIp ??
    request.headers.get("x-real-ip") ??
    ""
  );
}

export async function verifyTurnstileToken(
  token: unknown,
  request: Request,
  expectedAction: "login" | "register"
): Promise<TurnstileResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  if (!secret || !siteKey) {
    if (process.env.NODE_ENV === "production") {
      return {
        success: false,
        error: "人机验证未配置，请联系管理员。",
      };
    }

    return { success: true, skipped: true };
  }

  if (typeof token !== "string" || token.trim().length === 0) {
    return {
      success: false,
      error: "请先完成人机验证。",
    };
  }

  const formData = new FormData();
  formData.append("secret", secret);
  formData.append("response", token);

  const remoteIp = getClientIp(request);
  if (remoteIp) {
    formData.append("remoteip", remoteIp);
  }

  let response: Response;
  try {
    response = await fetch(SITEVERIFY_URL, {
      method: "POST",
      body: formData,
      signal: AbortSignal.timeout(8000),
    });
  } catch (error) {
    console.error("[turnstile] verification request failed", error);
    return {
      success: false,
      error: "人机验证服务暂时不可用，请稍后重试。",
    };
  }

  if (!response.ok) {
    console.error("[turnstile] siteverify returned", response.status);
    return {
      success: false,
      error: "人机验证服务暂时不可用，请稍后重试。",
    };
  }

  const result = (await response.json()) as TurnstileResponse;

  if (!result.success) {
    return {
      success: false,
      error: "人机验证未通过，请重试。",
      codes: result["error-codes"],
    };
  }

  if (result.action && result.action !== expectedAction) {
    console.warn("[turnstile] action mismatch", {
      expectedAction,
      actualAction: result.action,
    });

    return {
      success: false,
      error: "人机验证场景不匹配，请刷新页面后重试。",
    };
  }

  return { success: true };
}
