import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from "@react-email/components";
import { render } from "@react-email/render";

export type InscriptionConfirmedEmailProps = {
  playerName: string;
  matchTitle: string;
  matchWhen: string;
  siteUrl: string;
  matchPath: string;
};

export function InscriptionConfirmedEmail({
  playerName,
  matchTitle,
  matchWhen,
  siteUrl,
  matchPath,
}: InscriptionConfirmedEmailProps) {
  const matchUrl = `${siteUrl.replace(/\/$/, "")}${matchPath}`;
  return (
    <Html lang="es">
      <Head />
      <Preview>Tu pago fue confirmado — {matchTitle}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={heading}>Inscripción confirmada</Heading>
          <Text style={text}>Hola {playerName},</Text>
          <Text style={text}>
            Recibimos tu pago para <strong>{matchTitle}</strong>.
          </Text>
          <Text style={text}>Fecha y hora: {matchWhen}</Text>
          <Button href={matchUrl} style={button}>
            Ver partido
          </Button>
          <Text style={muted}>canchaAbierta — partidos de pádel y babyfútbol</Text>
        </Container>
      </Body>
    </Html>
  );
}

export async function renderInscriptionConfirmedEmail(
  props: InscriptionConfirmedEmailProps,
): Promise<string> {
  return await render(<InscriptionConfirmedEmail {...props} />);
}

const body = {
  backgroundColor: "#f4f4f5",
  fontFamily: "system-ui, sans-serif",
};

const container = {
  margin: "0 auto",
  padding: "32px 24px",
  maxWidth: "480px",
  backgroundColor: "#ffffff",
  borderRadius: "16px",
};

const heading = {
  fontSize: "22px",
  fontWeight: "600",
  color: "#18181b",
};

const text = {
  fontSize: "15px",
  lineHeight: "24px",
  color: "#3f3f46",
};

const muted = {
  fontSize: "12px",
  color: "#71717a",
  marginTop: "24px",
};

const button = {
  backgroundColor: "#86efac",
  color: "#052e16",
  borderRadius: "9999px",
  fontWeight: "600",
  padding: "12px 20px",
  textDecoration: "none",
};
