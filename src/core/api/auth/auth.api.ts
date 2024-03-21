import { Request, Response } from "express";
import { autoInjectable, singleton } from "tsyringe";
import {
  IAuthConfig_req,
  IAuthorizeCustom_req,
  IDirectPost_req,
  IToken_req,
} from "../../../shared/interfaces/auth.interface.js";
import Logger from "../../../shared/classes/logger.js";
import AuthService from "../../services/auth/auth.service.js";
import { AuthzRequest } from "openid-lib";

@singleton()
@autoInjectable()
export default class AuthApi {
  constructor(private authService: AuthService, private logger: Logger) { }

  getConfiguration = async (_req: Request, res: Response) => {
    this.logger.info("Getting OIDC configuration");
    const params = res.locals.validatedQuery as IAuthConfig_req;
    const { status, ...response } = await this.authService.getConfiguration(params.issuerUri);
    this.logger.info("✅   OIDC configuration returned");
    return res.status(status).json(response);
  };

  authorize = async (_req: Request, res: Response) => {
    this.logger.info("Authorize request received");
    const {
      issuerUri,
      privateKeyJwk: privateKeyStr,
      publicKeyJwk: publicKeyStr,
      ...params
    } = res.locals.validatedQuery as IAuthorizeCustom_req;
    const { status, ...response } = await this.authService.authorize(
      issuerUri,
      privateKeyStr,
      publicKeyStr,
      params as AuthzRequest,
    );
    this.logger.info("✅   Authorize response sent as redirection");
    return res.status(status).json(response);
  };

  directPost = async (_req: Request, res: Response) => {
    this.logger.info("Direct Post received with verified ID Token");
    const data = res.locals.validatedBody as IDirectPost_req;
    const { status, ...response } = await this.authService.directPost(
      data.issuerUri,
      data.privateKeyJwk,
      data.id_token,
      data.vp_token,
      data.presentation_submission,
    );
    this.logger.info("✅ Returning code response (Authorization Response) as redirection");
    return res.status(status).json(response);
  };

  grantAccessToken = async (_req: Request, res: Response) => {
    // TODO: CAMBIAR A pre-authorised_code
    this.logger.info("Token Request received");
    const {
      issuerUri,
      privateKeyJwk,
      publicKeyJwk,
      ...params
    } = res.locals.validatedBody as IToken_req;
    const { status, ...response } = await this.authService.grantAccessToken(
      issuerUri,
      privateKeyJwk,
      publicKeyJwk,
      params
    );
    this.logger.info("✅   Token response sent with Access Token");
    return res.set("Cache-Control", "no-store")
      .set("Pragma", "no-cache")
      .status(status)
      .json(response);
  };
}
