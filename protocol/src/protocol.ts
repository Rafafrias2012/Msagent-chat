export enum MSAgentProtocolMessageType {
    // Client-to-server
    Join = "join",
    Talk = "talk",
    // Server-to-client
    Init = "init",
    AddUser = "adduser",
    RemoveUser = "remuser",
    Message = "msg"
}

export interface MSAgentProtocolMessage {
    op: MSAgentProtocolMessageType
}

// Client-to-server

export interface MSAgentJoinMessage extends MSAgentProtocolMessage {
    op: MSAgentProtocolMessageType.Join,
    data: {
        username: string;
    }
}

export interface MSAgentTalkMessage extends MSAgentProtocolMessage {
    op: MSAgentProtocolMessageType.Talk,
    data: {
        msg: string;
    }
}

// Server-to-client

export interface MSAgentInitMessage extends MSAgentProtocolMessage {
    op: MSAgentProtocolMessageType.Init,
    data: {
        users: string[]
    }
}

export interface MSAgentAddUserMessage extends MSAgentProtocolMessage {
    op: MSAgentProtocolMessageType.AddUser,
    data: {
        username: string;
    }
}

export interface MSAgentRemoveUserMessage extends MSAgentProtocolMessage {
    op: MSAgentProtocolMessageType.RemoveUser,
    data: {
        username: string;
    }
}