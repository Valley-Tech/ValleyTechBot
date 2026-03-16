const SCREEN_RESPONSES = {
  FINALIZAR: {
    screen: "FINALIZAR",
    data: {},
  },
  SUCCESS: {
    screen: "SUCCESS",
    data: {},
  },
};

export const getNextScreen = async (decryptedBody) => {
  const { screen, data, version, action, flow_token } = decryptedBody;
  // handle health check request
  if (action === "ping") {
    return {
      data: {
        status: "active",
      },
    };
  }

  // handle error notification
  if (data?.error) {
    console.warn("Received client error:", data);
    return {
      data: {
        acknowledged: true,
      },
    };
  }

  if (action === "data_exchange") {
    let result;
    let details;

    switch (screen) {
      case "PRINCIPAL":
        const boletasString = data.boleta.join(', ');
        const totalBoletas = data.boleta.length;
        const totalAPagar = totalBoletas * 5000;  
        details = `Nombre:    ${data.name}\n
BOLETAS: ${boletasString}\n
Total a pagar: $${totalAPagar.toLocaleString('es-CO')} COP\n
Celular de contacto:    ${data.phone}\n
Dirección:    ${data.address}\n
Emprendimiento:    ${data.bussines}`;
        
        result = {
          ...SCREEN_RESPONSES.FINALIZAR,
          data: {
            details,
            ...data,
            boleta: boletasString,
            screen,
          },
        };
        break;

      case "FINALIZAR":
        result = {
          ...SCREEN_RESPONSES.SUCCESS,
          data: {
            extension_message_response: {
              params: { flow_token },
            },
          },
        };
        break;
    }

    return result;
  }

  console.error("Unhandled request body:", decryptedBody);
  throw new Error(
    "Unhandled endpoint request. Make sure you handle the request action & screen logged above."
  );
};