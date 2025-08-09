declare module "vanilla-cookieconsent" {
  export interface CookieConsentConfig {
    guiOptions?: {
      consentModal?: {
        layout?: string;
        position?: string;
        equalWeightButtons?: boolean;
        flipButtons?: boolean;
      };
      preferencesModal?: {
        layout?: string;
        position?: string;
        equalWeightButtons?: boolean;
        flipButtons?: boolean;
      };
    };
    categories?: {
      [key: string]: {
        readOnly?: boolean;
      };
    };
    language?: {
      default?: string;
      translations?: {
        [key: string]: {
          consentModal?: {
            title?: string;
            description?: string;
            acceptAllBtn?: string;
            acceptNecessaryBtn?: string;
            showPreferencesBtn?: string;
            footer?: string;
          };
          preferencesModal?: {
            title?: string;
            acceptAllBtn?: string;
            acceptNecessaryBtn?: string;
            savePreferencesBtn?: string;
            closeIconLabel?: string;
            serviceCounterLabel?: string;
            sections?: Array<{
              title?: string;
              description?: string;
              linkedCategory?: string;
            }>;
          };
        };
      };
    };
  }

  export function run(config: CookieConsentConfig): void;
}
