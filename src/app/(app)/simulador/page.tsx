import { SimuladorForm } from "./SimuladorForm";

export default function SimuladorPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-control-ink">
          Simulador de escalada
        </h1>
        <p className="mt-0.5 text-sm text-control-ink/45">
          Ajuste as premissas para simular quanto investimento é necessário para
          atingir determinada receita, ou quanto de receita um investimento
          gera, com base nas taxas de conversão do funil.
        </p>
      </div>
      <SimuladorForm />
    </div>
  );
}
